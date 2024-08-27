#!/usr/bin/env bash

set -eou pipefail

echo "🔧 Checking repos..."

# shellcheck disable=SC2068
for service in ${SERVICES[@]}; do
  diff=$(cd "./platforms/sulfoxide/${service}" && git diff)
  staged_dif=$(cd "./platforms/sulfoxide/${service}" && git diff --staged)
  if [ ! "$diff" = '' ] || [ ! "$staged_dif" = '' ]; then
    echo "$(pwd)/platforms/sulfoxide/${service} has changes!"
  fi
done

echo "🔧 Done!"
