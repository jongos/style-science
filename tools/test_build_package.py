"""Offline packaging regressions; all mutations stay in synthetic temporary repos."""

import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import zipfile

from build_package import build, REQUIRED, ROOT


class PackagingTests(unittest.TestCase):
    def setUp(self):
        scratch = ROOT / "dist"
        scratch.mkdir(exist_ok=True)
        self.directory = tempfile.TemporaryDirectory(prefix="gdc-package-test-", dir=scratch)
        assert Path(self.directory.name).resolve().parent == scratch.resolve()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name) / "source"
        self.root.mkdir()
        self.git("init", "-q")
        self.paths = json.loads((ROOT / "distribution.json").read_text(encoding="utf-8"))["files"]
        for path in self.paths:
            self.write(path, f"Synthetic committed fixture: {path}\n")
        for path in ('consumer-contract.json', 'consumer.mjs', 'consumer.py', 'engine.mjs', 'gdc.py', 'decision.mjs', 'decision.py', 'canvas.mjs', 'canvas.py', 'model-identity-policy.json', 'html.mjs'):
            self.write(path, (ROOT / path).read_text(encoding='utf-8'))
        self.write_json("distribution.json", dict(schemaVersion=1, files=self.paths))
        package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
        self.write_json("package.json", {"version": package["version"], "exports": package["exports"]})
        entries = [{"file": p.removeprefix("knowledge/"), "sha256": hashlib.sha256((self.root / p).read_bytes()).hexdigest()} for p in self.paths if p.startswith("knowledge/library/")]
        self.write_json("knowledge/inventory.json", dict(schemaVersion=1, entries=entries))
        inventory_hash = hashlib.sha256((self.root / "knowledge/inventory.json").read_bytes()).hexdigest()
        self.write_json("knowledge/provenance.json", dict(inventoryPath="knowledge/inventory.json", inventorySha256=inventory_hash))
        self.revision = self.commit()

    def git(self, *args):
        run = subprocess.run(["git", "-C", str(self.root), "-c", "core.autocrlf=false", "-c", "commit.gpgsign=false", "-c", "core.hooksPath=disabled-hooks", "-c", "user.name=Synthetic Test", "-c", "user.email=synthetic@example.invalid", *args], capture_output=True, check=True)
        return run.stdout.decode("utf-8").strip()

    def write(self, path, data):
        target = self.root / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(data, encoding="utf-8", newline="\n")

    def write_json(self, path, data):
        self.write(path, json.dumps(data, indent=2) + "\n")

    def commit(self):
        self.git("add", "--all")
        self.git("commit", "-qm", "Synthetic packaging fixture")
        return self.git("rev-parse", "HEAD")

    def output(self, name="out"):
        return Path(self.directory.name) / name

    def test_dirty_worktree_and_unlisted_committed_files_cannot_leak(self):
        self.write("committed-but-unlisted.log", "SYNTHETIC UNLISTED\n")
        revision = self.commit()
        original = (self.root / "engine.mjs").read_bytes()
        self.write("engine.mjs", "SYNTHETIC DIRTY RUNTIME\n")
        self.git("add", "engine.mjs")
        self.write("debug.log", "SYNTHETIC DEBUG\n")
        self.write(".env.local", "SYNTHETIC_CONFIG=true\n")
        self.write("research/unfinished.json", "{}\n")
        self.write_json("distribution.json", dict(schemaVersion=1, files=self.paths + ["debug.log", ".env.local"]))
        result = build(self.root, revision, self.output())
        with zipfile.ZipFile(self.output() / result["archive"]) as bundle:
            self.assertEqual(set(bundle.namelist()), {"style-science/" + p for p in self.paths} | {"style-science/SOURCE.json"})
            self.assertEqual(bundle.read("style-science/engine.mjs"), original)
            for p in REQUIRED:
                self.assertIn("style-science/" + p, bundle.namelist())
            source = json.loads(bundle.read("style-science/SOURCE.json"))
            self.assertEqual(source["sourceRevision"], revision)
            for path, digest in result["files"].items():
                self.assertEqual(hashlib.sha256(bundle.read("style-science/" + path)).hexdigest(), digest)
        self.assertEqual((self.root / "debug.log").read_text(), "SYNTHETIC DEBUG\n")
        self.assertEqual((self.root / "engine.mjs").read_bytes(), b"SYNTHETIC DIRTY RUNTIME\n")

    def test_identical_revision_produces_identical_bytes_and_hashes(self):
        def independent_build(output):
            source = "import json,sys; from build_package import build; print(json.dumps(build(sys.argv[1],sys.argv[2],sys.argv[3])))"
            result = subprocess.run([sys.executable, "-c", source, str(self.root), self.revision, str(output)], cwd=ROOT / "tools", capture_output=True, check=True)
            return json.loads(result.stdout)
        left = independent_build(self.output("left"))
        self.write("canvas.py", "dirty input must not alter archive\n")
        right = independent_build(self.output("right"))
        a = (self.output("left") / left["archive"]).read_bytes()
        b = (self.output("right") / right["archive"]).read_bytes()
        self.assertEqual(a, b)
        self.assertEqual(left, right)
        self.assertEqual(hashlib.sha256(a).hexdigest(), left["sha256"])
        with self.assertRaisesRegex(ValueError, "Output already exists"):
            build(self.root, self.revision, self.output("left"))
        self.assertEqual((self.output("left") / left["archive"]).read_bytes(), a)

    def test_local_replace_refs_cannot_rewrite_declared_source(self):
        original = (self.root / "engine.mjs").read_bytes()
        self.write("engine.mjs", "synthetic replacement\n")
        replacement = self.commit()
        self.git("replace", self.revision, replacement)
        result = build(self.root, self.revision, self.output())
        with zipfile.ZipFile(self.output() / result["archive"]) as bundle:
            self.assertEqual(bundle.read("style-science/engine.mjs"), original)
        self.assertEqual(result["sourceRevision"], self.revision)

    def test_missing_committed_file_does_not_fall_back_to_local_file(self):
        self.git("rm", "--cached", "LICENSE")
        self.git("commit", "-qm", "Synthetic missing license")
        revision = self.git("rev-parse", "HEAD")
        self.assertTrue((self.root / "LICENSE").exists())
        with self.assertRaisesRegex(ValueError, "Missing required distribution file.*LICENSE"):
            build(self.root, revision, self.output())
        self.assertFalse(self.output().exists())

    def test_omitted_license_and_unreviewed_runtime_export_fail(self):
        self.write_json("distribution.json", dict(schemaVersion=1, files=[p for p in self.paths if p != "LICENSE"]))
        with self.assertRaisesRegex(ValueError, "Missing required distribution entries: LICENSE"):
            build(self.root, self.commit(), self.output())
        self.write_json("distribution.json", dict(schemaVersion=1, files=self.paths))
        self.write_json("package.json", {"version": "0.3.0", "exports": {"./unfinished": "./unfinished.mjs"}})
        with self.assertRaisesRegex(ValueError, "Runtime export missing"):
            build(self.root, self.commit(), self.output())

    def test_frozen_data_and_license_provenance_are_enforced(self):
        notice = "knowledge/library/bolder-LICENSE.txt"
        self.write_json("distribution.json", dict(schemaVersion=1, files=[p for p in self.paths if p != notice]))
        with self.assertRaisesRegex(ValueError, "Missing required knowledge data/license entry"):
            build(self.root, self.commit(), self.output())
        self.write_json("distribution.json", dict(schemaVersion=1, files=self.paths))
        self.write(notice, "modified notice\n")
        with self.assertRaisesRegex(ValueError, "Knowledge data/license hash mismatch"):
            build(self.root, self.commit(), self.output())
        self.write_json("knowledge/provenance.json", dict(inventoryPath="knowledge/inventory.json", inventorySha256="wrong"))
        with self.assertRaisesRegex(ValueError, "inventory does not match"):
            build(self.root, self.commit(), self.output())

    def test_alias_revisions_trees_and_symlinks_fail(self):
        for revision in ("HEAD", "main", self.revision[:12], "v0.3.0", "../HEAD"):
            with self.assertRaisesRegex(ValueError, "full immutable"):
                build(self.root, revision, self.output())
        with self.assertRaisesRegex(ValueError, "must identify a commit"):
            build(self.root, self.git("rev-parse", "HEAD^{tree}"), self.output())
        blob = self.git("rev-parse", "HEAD:LICENSE")
        self.git("update-index", "--cacheinfo", f"120000,{blob},LICENSE")
        self.git("commit", "-qm", "Synthetic symlink mode")
        with self.assertRaisesRegex(ValueError, "regular committed blob"):
            build(self.root, self.git("rev-parse", "HEAD"), self.output())

    def test_invalid_or_duplicate_manifest_paths_fail(self):
        for extra in ("../outside", "/absolute", "local\\config", "wildcard/*", "a//b", "LICENSE", "license"):
            with self.subTest(path=extra):
                self.write_json("distribution.json", dict(schemaVersion=1, files=self.paths + [extra]))
                with self.assertRaisesRegex(ValueError, "Invalid distribution path|Duplicate or case-colliding"):
                    build(self.root, self.commit(), self.output())

    def test_reviewed_manifest_retains_real_frozen_inventory_not_research(self):
        self.assertTrue(REQUIRED <= set(self.paths))
        inventory = json.loads((ROOT / "knowledge/inventory.json").read_text(encoding="utf-8"))
        for entry in inventory["entries"]:
            self.assertIn("knowledge/" + entry["file"], self.paths)
        for excluded in ("debug.log", ".env.local", "language.mjs", "relation-measures.mjs", "evaluation/recipe-study/winners.json"):
            self.assertNotIn(excluded, self.paths)

    def test_consumers_load_and_validate_the_packaged_artifact(self):
        manifest = build(self.root, self.revision, self.output())
        with zipfile.ZipFile(self.output() / manifest['archive']) as bundle:
            bundle.extractall(self.output('extracted'))
        artifact = self.output('extracted') / 'style-science'
        expected = self.output('trusted.json')
        expected.write_text(json.dumps(manifest), encoding='utf-8')
        js = "import {readFile} from 'node:fs/promises'; import {inspectDistribution,negotiate} from './consumer.mjs'; const pkg=JSON.parse(await readFile('package.json','utf8')); for(const target of Object.values(pkg.exports)) await import(target); const p=JSON.parse(await readFile(process.argv[1],'utf8')); const i=await inspectDistribution('.',p); console.log(JSON.stringify([i,negotiate(i,{contractVersion:'1.0.0',planSchema:1,modules:['core','docx'],checks:['viewport-overflow','word-pagination','novel']}),negotiate(i,{contractVersion:'2.0.0',planSchema:1})]));"
        py = "import json,sys; from consumer import inspect_distribution,negotiate; import gdc,decision,canvas; p=json.load(open(sys.argv[1])); i=inspect_distribution('.',p); print(json.dumps([i,negotiate(i,dict(contractVersion='1.0.0',planSchema=1,modules=['core','docx'],checks=['viewport-overflow','word-pagination','novel'])),negotiate(i,dict(contractVersion='2.0.0',planSchema=1))]))"
        def reports():
            left = subprocess.run(['node', '--input-type=module', '-e', js, str(expected)], cwd=artifact, capture_output=True, check=True)
            right = subprocess.run([sys.executable, '-c', py, str(expected)], cwd=artifact, capture_output=True, check=True)
            self.assertEqual(json.loads(left.stdout), json.loads(right.stdout))
            return json.loads(left.stdout)
        result = reports()
        self.assertEqual(result[0]['status'], 'verified', result[0])
        self.assertEqual([x['status'] for x in result[1]['checks']], ['supported', 'unsupported', 'unknown'])
        self.assertEqual(result[1]['modules'][1]['status'], 'unsupported')
        self.assertEqual(result[2]['status'], 'unsupported')
        with (artifact / 'LICENSE').open('a', encoding='utf-8') as target:
            target.write('Synthetic tamper')
        self.assertEqual(reports()[0]['reason'], 'hash-mismatch')


if __name__ == "__main__":
    unittest.main(verbosity=2)
