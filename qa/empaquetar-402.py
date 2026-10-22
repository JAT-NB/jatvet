#!/usr/bin/env python3
"""Crea un paquete local completo; no compila otra rama ni despliega."""
import hashlib
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FILES = ['index.html', 'version.json', 'manifest.webmanifest', 'install.js', 'sw.js', 'firebase-config.json']
FILES += ['v4/' + n for n in ['index.html', 'version.json', 'manifest.webmanifest', 'install.js', 'sw.js',
    'firebase-config.json', 'app-session.js', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png',
    'login-logo.svg', 'login-pets.svg']]
FILES += ['assets/' + n for n in ['v4-backup-restauracion-20261019.js', 'repository-CdXTqB56.js', 'repository-CQZTQ0JS.css']]

if __name__ == '__main__':
    branch = subprocess.check_output(['git', 'branch', '--show-current'], cwd=ROOT, text=True).strip()
    assert branch == 'fix/qa-seguridad-recuperacion-2026-10-21', 'Rama inesperada'
    assert json.loads((ROOT / 'version.json').read_text())['version'] == '4.0.2'
    output = Path(sys.argv[1]).resolve()
    assert not output.exists() and output != ROOT and ROOT not in output.parents, 'Salida nueva fuera del repositorio requerida'
    for name in FILES:
        target = output / 'public/jatvet' / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes((ROOT / name).read_bytes())
    rules = output / 'private/firestore.proposed.rules'
    rules.parent.mkdir(parents=True)
    rules.write_bytes((ROOT / 'qa/firestore/firestore.proposed.rules').read_bytes())
    manifest = {'version': '4.0.2', 'channel': 'rc1', 'branch': branch,
        'commit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
        'warning': 'Backend original fijado en configuración; para QA móvil usar preparar-qa-movil.py y configuración QA verificada. NO desplegar este paquete sin revisión de destino.',
        'sha256': {str(p.relative_to(output)): hashlib.sha256(p.read_bytes()).hexdigest()
                   for p in output.rglob('*') if p.is_file()}}
    (output / 'artifact.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(output)
