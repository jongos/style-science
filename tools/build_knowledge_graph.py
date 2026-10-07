"""Index preserved source relationships without promoting guidance to scientific claims."""

from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]


def build():
    knowledge = ROOT / "knowledge"
    inventory = json.loads((knowledge / "inventory.json").read_text(encoding="utf-8"))
    nodes = []
    edges = []
    ids = {e["id"] for e in inventory["entries"]}
    for entry in inventory["entries"]:
        source = knowledge / entry["file"]
        assert hashlib.sha256(source.read_bytes()).hexdigest() == entry["sha256"]
        nodes.append(
            {
                "id": entry["id"],
                "kind": entry["kind"],
                "source": entry["file"],
                "status": entry["status"],
            }
        )
        if source.suffix == ".md":
            for target in sorted(
                set(re.findall(r"\]\(([^\s)]+)\)", source.read_text(encoding="utf-8")))
            ):
                if ":" in target or target.startswith("#"):
                    continue
                stem = Path(target.split("#")[0]).name
                if stem in ids:
                    edges.append(
                        {
                            "from": entry["id"],
                            "to": stem,
                            "relation": "references",
                            "evidence": "literal source link",
                        }
                    )
    graph = {
        "schemaVersion": 1,
        "version": "0.1.0",
        "meaning": "Traceable knowledge-reference graph, not a universal representation of design artifacts or proof of causal relationships.",
        "nodes": nodes,
        "edges": edges,
    }
    (knowledge / "graph.json").write_text(
        json.dumps(graph, indent=2) + "\n", encoding="utf-8"
    )
    print(f"Indexed {len(nodes)} knowledge nodes and {len(edges)} source relationships")


if __name__ == "__main__":
    build()
