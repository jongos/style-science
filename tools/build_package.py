"""Build a portable ZIP using only explicitly listed blobs from a full commit ID."""

import argparse
import hashlib
import io
import json
from pathlib import Path, PurePosixPath
import re
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = "distribution.json"
REQUIRED = {
    MANIFEST, "package.json", "LICENSE", "engine.mjs", "gdc.py", "html.mjs",
    "decision.mjs", "decision.py", "canvas.mjs", "canvas.py",
    "schemas/plan.schema.json", "knowledge/LICENSE.txt", "knowledge/PROVENANCE.md",
    "knowledge/provenance.json", "knowledge/inventory.json", "knowledge/registry.json",
    "knowledge/graph.json",
}


def git(root, *args):
    result = subprocess.run(["git", "--no-replace-objects", "-C", str(root), *args], capture_output=True)
    if result.returncode:
        raise ValueError("Git source read failed: " + result.stderr.decode("utf-8", errors="replace").strip())
    return result.stdout


def safe_path(value):
    if not isinstance(value, str) or not re.fullmatch(r"[A-Za-z0-9_./-]+", value):
        raise ValueError(f"Invalid distribution path: {value!r}")
    if str(PurePosixPath(value)) != value or value.startswith("/") or any(p in (".", "..") for p in value.split("/")):
        raise ValueError(f"Invalid distribution path: {value!r}")
    return value


def source_files(root, revision):
    if not re.fullmatch(r"(?:[a-f0-9]{40}|[a-f0-9]{64})", revision):
        raise ValueError("--revision must be a full immutable lowercase commit ID, not a branch, tag or abbreviated ID")
    if git(root, "cat-file", "-t", revision).strip() != b"commit":
        raise ValueError("Source revision must identify a commit")
    tree = {}
    for record in git(root, "ls-tree", "-rz", "--full-tree", revision).split(b"\0"):
        if record:
            metadata, path = record.split(b"\t", 1)
            mode, kind, oid = metadata.decode("ascii").split()
            tree[path.decode("utf-8")] = (mode, kind, oid)

    def read(path):
        entry = tree.get(path)
        if entry is None:
            raise ValueError(f"Missing required distribution file at {revision}: {path}")
        mode, kind, oid = entry
        if kind != "blob" or mode not in ("100644", "100755"):
            raise ValueError(f"Distribution file must be a regular committed blob: {path}")
        return git(root, "cat-file", "blob", oid)

    manifest = json.loads(read(MANIFEST))
    if not isinstance(manifest, dict) or set(manifest) != {"schemaVersion", "files"} or type(manifest["schemaVersion"]) is not int or manifest["schemaVersion"] != 1:
        raise ValueError("Invalid distribution manifest schema")
    paths = manifest["files"]
    if not isinstance(paths, list):
        raise ValueError("Distribution files must be an explicit list")
    for path in paths:
        safe_path(path)
    if len({p.lower() for p in paths}) != len(paths):
        raise ValueError("Duplicate or case-colliding distribution paths")
    missing = REQUIRED - set(paths)
    if missing:
        raise ValueError("Missing required distribution entries: " + ", ".join(sorted(missing)))
    files = {path: read(path) for path in sorted(paths)}
    package = json.loads(files["package.json"])
    version = package.get("version")
    if not isinstance(version, str) or not re.fullmatch(r"[0-9]+\.[0-9]+\.[0-9]+(?:-[A-Za-z0-9.-]+)?", version):
        raise ValueError("Invalid package version")
    exports = package.get("exports")
    if not isinstance(exports, dict) or not exports:
        raise ValueError("Declare package runtime exports")
    for target in exports.values():
        if not isinstance(target, str) or not target.startswith("./") or safe_path(target[2:]) not in files:
            raise ValueError(f"Runtime export missing from distribution: {target!r}")
    # Frozen imported data and its notices are a unit, not optional sidecars.
    provenance = json.loads(files["knowledge/provenance.json"])
    inventory_bytes = files["knowledge/inventory.json"].replace(b"\r\n", b"\n")
    if provenance.get("inventoryPath") != "knowledge/inventory.json" or hashlib.sha256(inventory_bytes).hexdigest() != provenance.get("inventorySha256"):
        raise ValueError("Knowledge inventory does not match its provenance")
    for entry in json.loads(inventory_bytes)["entries"]:
        path = "knowledge/" + safe_path(entry["file"])
        if path not in files:
            raise ValueError(f"Missing required knowledge data/license entry: {path}")
        if hashlib.sha256(files[path]).hexdigest() != entry["sha256"]:
            raise ValueError(f"Knowledge data/license hash mismatch: {path}")
    return version, files


def archive_bytes(files):
    output = io.BytesIO()
    # Stored entries avoid compression-library/version variability.
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_STORED) as bundle:
        for path, data in sorted(files.items()):
            info = zipfile.ZipInfo("style-science/" + path, (1980, 1, 1, 0, 0, 0))
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            bundle.writestr(info, data)
    return output.getvalue()


def build(root, revision, out):
    version, files = source_files(root, revision)
    if "SOURCE.json" in files:
        raise ValueError("SOURCE.json is reserved for generated source provenance")
    provenance = {
        "schemaVersion": 1, "version": version, "sourceRevision": revision,
        "distributionManifest": MANIFEST,
        "distributionManifestSha256": hashlib.sha256(files[MANIFEST]).hexdigest(),
        "files": {path: hashlib.sha256(data).hexdigest() for path, data in files.items()},
    }
    files["SOURCE.json"] = (json.dumps(provenance, indent=2) + "\n").encode("utf-8")
    data = archive_bytes(files)
    if data != archive_bytes(files):
        raise ValueError("Archive reproducibility check failed")
    digest = hashlib.sha256(data).hexdigest()
    archive_name = f"style-science-gdc-{version}-{revision}-{digest}.zip"
    output_manifest = dict(provenance, archive=archive_name, sha256=digest)
    out = Path(out)
    out.mkdir(parents=True, exist_ok=True)
    archive = out / archive_name
    sidecar = out / (archive_name + ".manifest.json")
    # Refuse to overwrite pre-existing or concurrently created artifacts.
    if archive.exists() or sidecar.exists():
        raise ValueError("Output already exists; choose a fresh --output directory")
    with archive.open("xb") as target:
        target.write(data)
    with sidecar.open("x", encoding="utf-8", newline="\n") as target:
        target.write(json.dumps(output_manifest, indent=2) + "\n")
    return output_manifest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--revision", required=True, help="Full reviewed commit ID")
    parser.add_argument("--output", type=Path, required=True, help="New output directory; existing artifacts are never overwritten")
    args = parser.parse_args()
    try:
        manifest = build(ROOT, args.revision, args.output)
    except (ValueError, KeyError, TypeError, OSError) as exc:
        parser.exit(1, f"Packaging failed: {exc}\n")
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
