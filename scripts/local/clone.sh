#!/usr/bin/env bash

set -eou pipefail

echo "🔧 Cloning repos..."

# shellcheck disable=SC2068
for service in ${SERVICES[@]}; do

  if [ -d "./platforms/sulfoxide/${service}" ]; then
    echo "✅ sulfoxide.${service} already cloned, skipping..."
    continue
  fi
  echo "⬇️ Cloning sulfoxide.${service}..."
  git clone "git@github.com:AtomiCloud/sulfoxide.${service}.git" "./platforms/sulfoxide/${service}"
done

echo "🔧 Done!"
