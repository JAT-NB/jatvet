#!/usr/bin/env python3
"""Ensambla artefactos locales; nunca autentica, crea recursos ni despliega."""
import argparse
import hashlib
import json
import re
import subprocess
from pathlib import Path

PROJECT = 'jatvet-qa-movil-261022-a7c4'
BRANCH = 'fix/qa-seguridad-recuperacion-2026-10-21'
ROOT = Path(__file__).resolve().parent.parent


def build(config_path, output, version):
    branch = subprocess.check_output(['git', 'branch', '--show-current'], cwd=ROOT, text=True).strip()
    if branch != BRANCH:
        raise ValueError('Rama no autorizada')
    config = json.loads(config_path.read_text())
    keys = {'apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'}
    if set(config) != keys or any(not isinstance(v, str) or not v for v in config.values()):
        raise ValueError('Se requieren exactamente los seis campos públicos Firebase')
    if config['projectId'] != PROJECT or config['authDomain'] != PROJECT + '.firebaseapp.com':
        raise ValueError('Destino no autorizado')
    if config['storageBucket'] not in {PROJECT + '.firebasestorage.app', PROJECT + '.appspot.com'}:
        raise ValueError('Bucket ajeno al QA')
    if not re.fullmatch(r'[0-9]+', config['messagingSenderId']):
        raise ValueError('Sender ID inválido')
    if not re.fullmatch(r'1:' + config['messagingSenderId'] + r':web:[a-zA-Z0-9]+', config['appId']):
        raise ValueError('App ID inconsistente')
    if output.exists():
        raise ValueError('El directorio de salida debe ser nuevo; no se sobrescribe nada')
    if output == ROOT or ROOT in output.parents:
        raise ValueError('La salida debe estar fuera del repositorio')
    files = {f'jatvet/v4/{name}': (ROOT / 'v4' / name).read_bytes() for name in [
        'index.html', 'version.json', 'app-session.js', 'sw.js', 'install.js', 'manifest.webmanifest',
        'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'login-pets.svg', 'login-logo.svg']}
    for name in ['v4-backup-restauracion-20261019.js', 'repository-CdXTqB56.js', 'repository-CQZTQ0JS.css']:
        files['jatvet/assets/' + name] = (ROOT / 'assets' / name).read_bytes()
    sdk_key = 'jatvet/assets/repository-CdXTqB56.js'
    sdk = files[sdk_key].decode()
    sdk, count = re.subn(r'var T=Object\.freeze\(\{apiKey:.*?\}\);function Sn',
        lambda _: 'var T=Object.freeze(' + json.dumps(config) + ');function Sn', sdk, count=1)
    if count != 1:
        raise ValueError('No se encontró el validador estricto esperado; revisar el bundle')
    files[sdk_key] = sdk.encode()
    files['jatvet/v4/firebase-config.json'] = json.dumps(config, indent=2).encode()
    manifest_key = 'jatvet/v4/manifest.webmanifest'
    manifest = json.loads(files[manifest_key])
    manifest.update(name='JAT Vet QA móvil', short_name='JAT Vet QA')
    files[manifest_key] = json.dumps(manifest, ensure_ascii=False, indent=2).encode()
    for name in list(files):
        if name.endswith(('.js', '.html')):
            text = files[name].decode().replace('jat-vet-pruebas', PROJECT)
            text = text.replace('v4.0.2-rc1', version).replace('v4.0.2-rc1', version)
            if name.endswith('index.html'):
                text = text.replace('<title>JAT Vet</title>', '<title>JAT Vet QA móvil · ' + version + '</title>')
                text = text.replace('🐾</span> JAT Vet</h1>', '🐾</span> JAT Vet QA móvil</h1>')
            files[name] = text.encode()
    rules = (ROOT / 'qa/firestore/firestore.proposed.rules').read_text().replace('jat-vet-pruebas', PROJECT)
    if 'jat-vet-pruebas' in rules or any(b'jat-vet-pruebas' in content for content in files.values()):
        raise ValueError('Referencia al backend existente: salida rechazada')
    output.mkdir(parents=True)
    for name, content in files.items():
        path = output / 'public' / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)
    (output / 'firestore.rules').write_text(rules)
    hosting = {'site': PROJECT, 'public': 'public', 'ignore': ['firebase.json', '**/.*'],
        'redirects': [{'source': '/', 'destination': '/jatvet/v4/', 'type': 302}],
        'headers': [{'source': '**', 'headers': [{'key': 'Cache-Control', 'value': 'no-cache'}]}]}
    (output / 'firebase.json').write_text(json.dumps({'hosting': hosting, 'firestore': {'rules': 'firestore.rules'}}, indent=2))
    hashes = {str(p.relative_to(output)): hashlib.sha256(p.read_bytes()).hexdigest()
              for p in output.rglob('*') if p.is_file()}
    (output / 'artifact.json').write_text(json.dumps({'project': PROJECT, 'site': PROJECT,
        'branch': branch, 'version': version, 'commit': subprocess.check_output(
        ['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(), 'sha256': hashes,
        'deployed': False, 'remote_config_verified': False}, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--config', required=True, type=Path, help='Configuración pública registrada en el nuevo proyecto')
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--version', required=True, choices=['QA-M1', 'QA-M2'])
    args = parser.parse_args()
    build(args.config, args.output.resolve(), args.version)
