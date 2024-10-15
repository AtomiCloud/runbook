#!/usr/bin/env bash

set -eou pipefail

echo "🔧 Pulling from all repos..."

CYAN=$(tput setaf 6) # Red text
RESET=$(tput sgr0)

# shellcheck disable=SC2068
for service in ${SERVICES[@]}; do
  echo "⬇️ Pulling sulfoxide.${service}..."
  set +e
  cd "./platforms/sulfoxide/${service}" && git pull 2>&1 | awk -v prefix="${CYAN}${service}${RESET}\t" '{print prefix " " $0}' &
  set -e
done

echo "🌟 Waiting for pulls to finish..."
wait
echo "✅ Done!"
