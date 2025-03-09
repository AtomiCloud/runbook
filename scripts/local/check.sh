#!/usr/bin/env bash

set -eou pipefail

CYAN=$(tput setaf 6) # Red text
RESET=$(tput sgr0)

check_for_pull() {
  svc=$1
  cd "./platforms/sulfoxide/${svc}" || {
    echo "Failure to navigate to sulfoxide.${svc}"
    return 1
  }

  LOCAL=$(git rev-parse @)
  set +e
  # shellcheck disable=SC1083,SC1083
  UPSTREAM=$(git rev-parse --abbrev-ref @{u} 2>/dev/null)
  set -e
  if [ -z "$UPSTREAM" ]; then
    return 0
  fi
  # shellcheck disable=SC1083,SC1083
  REMOTE=$(git rev-parse @{u})
  # shellcheck disable=SC1083,SC1083
  BASE=$(git merge-base @ @{u})
  if [ "$LOCAL" = "$REMOTE" ]; then
    :
  elif [ "$LOCAL" = "$BASE" ]; then
    # shellcheck disable=SC2028
    echo "${CYAN}${svc}${RESET}\tNeeds pull"
  elif [ "$REMOTE" = "$BASE" ]; then
    # shellcheck disable=SC2028
    echo "${CYAN}${svc}${RESET}\tNeeds push"
  else
    # shellcheck disable=SC2028
    echo "${CYAN}${svc}${RESET}\tDiverged branch"
  fi
}

check_for_diff() {
  svc=$1
  cd "./platforms/sulfoxide/${svc}" || {
    echo "Failure to navigate to sulfoxide.${svc}"
    return 1
  }
  diff=$(git diff)
  staged_dif=$(git diff --staged)
  if [ ! "$diff" = '' ] || [ ! "$staged_dif" = '' ]; then
    # shellcheck disable=SC2028
    echo "${CYAN}${svc}${RESET}\tChanges detected"
  fi
}

echo "🔧 Checking repos..."

set +e
# shellcheck disable=SC2068
for service in ${SERVICES[@]}; do
  cd "./platforms/sulfoxide/${service}" && git fetch &
done
set -e

echo "🌟 Waiting for fetch to finish..."
wait
echo "✅ Done fetching"

CURRENT_DIR=$(pwd)
# shellcheck disable=SC2068
for service in ${SERVICES[@]}; do

  check_for_diff "$service"
  cd "$CURRENT_DIR" || {
    echo "Failed to return to $CURRENT_DIR"
    exit 1
  }

  check_for_pull "$service"

  cd "$CURRENT_DIR" || {
    echo "Failed to return to $CURRENT_DIR"
    exit 1
  }
done

echo "🔧 Done!"
