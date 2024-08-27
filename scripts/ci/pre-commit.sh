#!/usr/bin/env bash

set -eou pipefail

bun i --frozen-lockfile

pre-commit run --all-files -v
