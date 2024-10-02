#!/usr/bin/env bash

set -eou pipefail

echo "🔧 Pushing repos..."

CYAN=$(tput setaf 6) # Red text
RESET=$(tput sgr0)

# shellcheck disable=SC2068
for service in ${SERVICES[@]}; do
  echo "🖥️ Pushing sulfoxide.${service}..."
  set +e
  # shellcheck disable=SC1083,SC1083
  remote=$(cd "./platforms/sulfoxide/${service}" && git log @{u}.. | wc -l)
  if [ ! "$remote" = "0" ]; then
    cd "./platforms/sulfoxide/${service}" && nix develop -c git push 2>&1 | awk -v prefix="${CYAN}${service}${RESET}\t" '{print prefix " " $0}' &
  fi
  set -e
done

echo "🌟 Waiting for committing to finish..."
wait
echo "✅ Done!"
