#!/bin/sh
# Lints the staged GitHub workflows (lint-staged passes their paths), shellcheck included for their run: scripts.
# A machine without actionlint commits anyway, with a note: CI runs it on every PR (install: mise install, in the repo).
if command -v actionlint >/dev/null 2>&1; then
  # Without shellcheck, actionlint skips the run: scripts silently
  command -v shellcheck >/dev/null 2>&1 ||
    echo "actionlint: shellcheck not found, run: scripts not checked (run: mise install, in the repo)" >&2
  exec actionlint "$@"
fi
echo "actionlint: not found, workflows not checked before this commit (run: mise install, in the repo)" >&2
