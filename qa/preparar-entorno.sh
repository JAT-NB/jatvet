#!/usr/bin/env bash
set -euo pipefail
cd /workspace/jatvet
test "$(git branch --show-current)" = fix/qa-seguridad-recuperacion-2026-10-21
node --version
python3 --version
java -version
test -x /usr/bin/chromium
mkdir -p /workspace/qa-tools
npm install --prefix /workspace/qa-tools --cache /workspace/.npm-cache --no-audit --no-fund playwright@1.58.2 firebase-tools@15.14.0 firebase@12.4.0 @firebase/rules-unit-testing@5.0.0
if [ ! -e /workspace/node_modules ]; then
  ln -s /workspace/qa-tools/node_modules /workspace/node_modules
fi
task_jar=/workspace/qa-tools/firestore-official/cloud-firestore-emulator.jar
task_image=gcr.io/google.com/cloudsdktool/google-cloud-cli@sha256:ba2726407ae3654d11ffdcd2eff74879f46c2ce805a8caa554d690afb615e433
task_docker=(env -u DOCKER_HOST -u DOCKER_CONTEXT -u DOCKER_TLS -u DOCKER_TLS_VERIFY -u DOCKER_CERT_PATH docker --host=unix:///var/run/docker.sock)
if [ ! -f "$task_jar" ]; then
  "${task_docker[@]}" info >/dev/null
  "${task_docker[@]}" pull "$task_image"
  task_container=$("${task_docker[@]}" create --network none "$task_image")
  trap '"${task_docker[@]}" rm "$task_container" >/dev/null' EXIT
  "${task_docker[@]}" cp "$task_container":/google-cloud-sdk/platform/cloud-firestore-emulator /workspace/qa-tools/firestore-official
  "${task_docker[@]}" rm "$task_container" >/dev/null
  trap - EXIT
fi
sha256sum --check <<'CHECKSUM'
6262939c48d3d6b08495931706b8920399e57d5f5918e6af133a3d30cb3ae369  /workspace/qa-tools/firestore-official/cloud-firestore-emulator.jar
CHECKSUM
bash /workspace/qa-tools/firestore-official/cloud_firestore_emulator --version
node tests/actualizacion-silenciosa.cjs
