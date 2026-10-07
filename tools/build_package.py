"""Create a deterministic portable source/data ZIP and SHA-256 manifest."""

from pathlib import Path
import hashlib
import json
import zipfile

ROOT = Path(__file__).resolve().parents[1]


def build():
    version = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))["version"]
    out = ROOT / "dist"
    out.mkdir(exist_ok=True)
    archive = out / f"style-science-gdc-{version}.zip"
    files = sorted(
        p
        for p in ROOT.rglob("*")
        if p.is_file()
        and not any(
            part in (".git", "node_modules", "dist", "__pycache__")
            for part in p.relative_to(ROOT).parts
        )
        and p.suffix != ".pyc"
    )
    hashes = {}
    with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED) as bundle:
        for source in files:
            relative = source.relative_to(ROOT).as_posix()
            data = source.read_bytes()
            info = zipfile.ZipInfo("style-science/" + relative, (2026, 10, 7, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            bundle.writestr(info, data)
            hashes[relative] = hashlib.sha256(data).hexdigest()
    manifest = {
        "version": version,
        "archive": archive.name,
        "sha256": hashlib.sha256(archive.read_bytes()).hexdigest(),
        "files": hashes,
    }
    (out / "manifest.json").write_text(
        json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
    )
    print(archive)


if __name__ == "__main__":
    build()
