#!/usr/bin/env bash

set -eou pipefail

message="$1"

echo "🔧 Committing repos..."

CYAN=$(tput setaf 6) # Red text
RESET=$(tput sgr0)

# shellcheck disable=SC2068
for service in ${SERVICES[@]}; do
  echo "🖥️ Committing sulfoxide.${service}..."
  set +e
  cd "./platforms/sulfoxide/${service}" && nix develop -c git commit -m "${message}" 2>&1 | awk -v prefix="${CYAN}${service}${RESET}\t" '{print prefix " " $0}' &
  set -e
done

echo "🌟 Waiting for committing to finish..."
wait
echo "✅ Done!"
