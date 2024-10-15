#!/usr/bin/env bash

set -eou pipefail

echo "🔧 Executing pre-commit on all repos..."

CYAN=$(tput setaf 6) # Red text
RESET=$(tput sgr0)

# shellcheck disable=SC2068
for service in ${SERVICES[@]}; do
  echo "🔧 PCR sulfoxide.${service}..."
  set +e
  cd "./platforms/sulfoxide/${service}" && nix develop -c pre-commit run --all 2>&1 | awk -v prefix="${CYAN}${service}${RESET}\t" '{print prefix " " $0}' &
  set -e
done

echo "🌟 Waiting for PCR to finish..."
wait
echo "✅ Done!"
