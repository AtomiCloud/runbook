#!/usr/bin/env bash

set -eou pipefail

bun i

pre-commit run --all-files -v
