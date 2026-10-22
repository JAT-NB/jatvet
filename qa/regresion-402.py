#!/usr/bin/env python3
"""Regresión local secuencial. Requiere emuladores 8180, 9299 y 9199."""
import json
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path

root = Path(__file__).resolve().parent.parent
out = root / 'qa/resultados/4.0.2-rc1'
out.mkdir(exist_ok=True)
env = os.environ.copy()
env['NODE_PATH'] = '/workspace/qa-tools/node_modules'
commands = ['qa/firestore/integracion.cjs', 'qa/firestore/expiry.cjs',
    'qa/firestore/boundary.cjs', 'qa/firestore/navegador.cjs', 'qa/certificacion.cjs',
    'qa/offline.cjs', 'qa/auth-emulador.cjs', 'tests/actualizacion-silenciosa.cjs', 'qa/pwa-402.cjs']
results = []
run = {'started_at': datetime.now(timezone.utc).isoformat(),
    'commit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip(), 'commands': results}
for command in commands:
    name = Path(command).name
    print('START', name, flush=True)
    log = out / ('regresion-estatica.txt' if name == 'actualizacion-silenciosa.cjs' else name + '.log')
    with log.open('w') as file:
        try:
            code = subprocess.run(['node', command], cwd=root, env=env, stdout=file,
                                  stderr=subprocess.STDOUT, timeout=240).returncode
        except subprocess.TimeoutExpired:
            code = 124
    results.append({'runner': name, 'exit_code': code})
    (out / 'exit-codes.json').write_text(json.dumps(run, indent=2) + '\n')
    print('END', name, code, flush=True)
raise SystemExit(1 if any(r['exit_code'] for r in results) else 0)
