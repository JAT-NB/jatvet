"""Consolida casos únicos; preserva la matriz y las evidencias previas."""
import csv
import hashlib
import json
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
QA = ROOT / "qa"
OUT = QA / "resultados/4.0.2-rc1"

with (QA / "historico/matriz-85-casos.csv").open() as file:
    rows = {row["id"]: row for row in csv.DictReader(file)}

sources = ["ejecucion.json", "auth-emulador.json", "firestore.json",
           "navegador-integrado.json", "offline.json", "expiry-cases.json",
           "expiry-boundary.json"]
groups = defaultdict(list)
for name in sources:
    path = OUT / name
    data = json.loads(path.read_text())
    assert data.get("timestamp"), f"Falta fecha de ejecución: {name}"
    for result in data["results"]:
        groups[result["id"]].append((str(path.relative_to(ROOT)), result))

static = OUT / "regresion-estatica.txt"
assert "PASS: 8 comprobaciones" in static.read_text()
groups["REG-01"].append((str(static.relative_to(ROOT)), {
    "id": "REG-01", "title": "Regresión existente: 8 aserciones estáticas",
    "status": "PASS"}))

rank = {"PASS": 0, "BLOQUEADA": 1, "FAIL": 2}
for case_id, observations in groups.items():
    status = max((result["status"] for _, result in observations), key=rank.get)
    result = next(result for _, result in observations if result["status"] == status)
    row = rows.get(case_id, {"id": case_id})
    row.update(title=result["title"], status=status, error=result.get("error", ""),
               reason=result.get("reason", ""),
               evidence="; ".join(path for path, _ in observations))
    rows[case_id] = row

rows["PWA-03"]["title"] = "Internet obligatorio: desconexión sin operaciones clínicas y retorno seguro"
rows["PWA-03"]["evidence"] += "; qa/CRITERIOS-ACEPTACION.md"
for case_id in ["PWA-04", "PWA-05", "OPS-01", "AUTH-REAL-01"]:
    # No convertir bloqueos externos en PASS mediante inferencia o cambio de criterio.
    rows[case_id]["evidence"] = "qa/INFORME-CERTIFICACION.md"

with (QA / "resultados/matriz.csv").open("w", newline="") as file:
    writer = csv.DictWriter(file, fieldnames=["id", "title", "status", "error", "reason", "evidence"], lineterminator="\n")
    writer.writeheader()
    writer.writerows(rows.values())
with (QA / "casos-certificacion.csv").open("w", newline="") as file:
    writer = csv.writer(file, lineterminator="\n")
    writer.writerow(["ID", "Area", "Prueba", "Prioridad", "Estado"])
    for row in rows.values():
        writer.writerow([row["id"], row["id"].split("-")[0], row["title"],
                         "Critica" if row["id"].startswith(("SEC", "EXP", "DATA", "RECOVERY")) else "Alta", row["status"]])

counts = Counter(row["status"] for row in rows.values())
summary = {"timestamp": datetime.now(timezone.utc).isoformat(), "total": len(rows),
           "counts": {status: counts[status] for status in ("PASS", "FAIL", "BLOQUEADA")}, "executed_unique": counts["PASS"] + counts["FAIL"],
           "acceptance": "qa/CRITERIOS-ACEPTACION.md",
           "production_changed": False, "rules_deployed": False,
           "verdict": "Correcciones listas para revisión; certificación comercial final pendiente de bloqueos externos"}
(OUT / "resumen.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n")

files = ["v4/app-session.js", "v4/index.html", "v4/sw.js",
         "assets/v4-backup-restauracion-20261019.js", "assets/repository-CdXTqB56.js",
         "qa/firestore/firestore.rules", "qa/firestore/firestore.proposed.rules",
         "qa/firestore/integracion.cjs", "qa/firestore/expiry.cjs", "qa/firestore/boundary.cjs",
         "qa/firestore/navegador.cjs", "qa/certificacion.cjs", "qa/offline.cjs", "qa/auth-emulador.cjs"]
manifest = {"baseline_commit": "fd21f2eee0b02a8ee913338164ae557822af5007",
            "branch": "fix/qa-seguridad-recuperacion-2026-10-21",
            "files_sha256": {name: hashlib.sha256((ROOT/name).read_bytes()).hexdigest() for name in files}}
assert manifest["files_sha256"]["qa/firestore/firestore.rules"] == "6dac84f09a73458c96e56afc93f1ef20c14614f20e3836cc259a255fe1733cba"
(OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
print(json.dumps(summary, ensure_ascii=False))
raise SystemExit(1 if counts["FAIL"] else 0)
