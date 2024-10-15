#!/usr/bin/env bash

set -eou pipefail

echo "🔧 Adding files to stage for all repos..."

CYAN=$(tput setaf 6) # Red text
RESET=$(tput sgr0)

# shellcheck disable=SC2068
for service in ${SERVICES[@]}; do
  echo "➕Adding files to stage for sulfoxide.${service}..."
  set +e
  cd "./platforms/sulfoxide/${service}" && git add . 2>&1 | awk -v prefix="${CYAN}${service}${RESET}\t" '{print prefix " " $0}' &
  set -e
done

echo "🌟 Waiting for adding to finish..."
wait
echo "✅ Done!"
