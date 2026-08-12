#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
CURRENT_DIR="$(pwd -P)"
FAILURES=0
CHECKS=0

log() {
  printf '%s\n' "$*"
}

pass() {
  CHECKS=$((CHECKS + 1))
  log "PASS: $*"
}

fail() {
  CHECKS=$((CHECKS + 1))
  FAILURES=$((FAILURES + 1))
  log "FAIL: $*"
}

skip() {
  log "SKIP: $*"
}

require_command() {
  command -v "$1" >/dev/null 2>&1
}

relative_path() {
  local path="$1"
  printf '%s\n' "${path#"$ROOT_DIR"/}"
}

log "Agent Fieldbook validation"
log "Root: $ROOT_DIR"

case "$ROOT_DIR" in
  */agent-fieldbook) pass "validation root is agent-fieldbook" ;;
  *) fail "validation root must be the agent-fieldbook directory" ;;
esac

case "$ROOT_DIR" in
  *agency-control-room*) fail "validation root unexpectedly points at agency-control-room" ;;
  *) pass "scope guard excludes agency-control-room" ;;
esac

case "$CURRENT_DIR" in
  "$ROOT_DIR"|"$ROOT_DIR"/*) pass "command is running inside the agent-fieldbook tree" ;;
  *) fail "run this script from inside $ROOT_DIR" ;;
esac

if [[ -s "$ROOT_DIR/TEST_PLAN.md" ]]; then
  pass "TEST_PLAN.md exists and is non-empty"
else
  fail "TEST_PLAN.md is missing or empty"
fi

for heading in "## Scope" "## Test matrix" "## Validation command" "## Acceptance criteria"; do
  if grep -Fq "$heading" "$ROOT_DIR/TEST_PLAN.md"; then
    pass "TEST_PLAN.md contains $heading"
  else
    fail "TEST_PLAN.md is missing $heading"
  fi
done

if [[ -f "$ROOT_DIR/DESIGN.md" ]]; then
  pass "DESIGN.md exists"
  for heading in "## Product intent" "## Information architecture" "### Primary create flow" "### Quick capture flow" "### Review workflow"; do
    if grep -Fq "$heading" "$ROOT_DIR/DESIGN.md"; then
      pass "DESIGN.md contains $heading"
    else
      fail "DESIGN.md is missing $heading"
    fi
  done

  for phrase in "Verification steps" "Acceptance criteria"; do
    if grep -Fq "$phrase" "$ROOT_DIR/DESIGN.md"; then
      pass "DESIGN.md includes playbook $phrase"
    else
      fail "DESIGN.md is missing playbook $phrase"
    fi
  done
else
  skip "DESIGN.md not found; product-spec checks skipped"
fi

if [[ -s "$ROOT_DIR/SECURITY.md" ]]; then
  pass "SECURITY.md exists and is non-empty"
else
  fail "SECURITY.md is missing or empty"
fi

if [[ -s "$ROOT_DIR/security/implementation-notes.md" ]]; then
  pass "security/implementation-notes.md exists and is non-empty"
else
  fail "security/implementation-notes.md is missing or empty"
fi

if [[ -f "$ROOT_DIR/tests/security_static_checks.py" ]]; then
  if require_command python3; then
    if (cd "$ROOT_DIR" && python3 -B tests/security_static_checks.py); then
      pass "security static checks passed"
    else
      fail "security static checks failed"
    fi
  else
    fail "python3 is required for security static checks"
  fi
else
  fail "tests/security_static_checks.py is missing"
fi

if [[ -f "$ROOT_DIR/tests/security_unit_tests.mjs" ]]; then
  if require_command node; then
    if (cd "$ROOT_DIR" && node tests/security_unit_tests.mjs); then
      pass "security unit tests passed"
    else
      fail "security unit tests failed"
    fi
  else
    fail "Node is required for security unit tests"
  fi
else
  fail "tests/security_unit_tests.mjs is missing"
fi

implementation_files=()
while IFS= read -r file; do
  implementation_files+=("$file")
done < <(
  find "$ROOT_DIR" \
    -path "$ROOT_DIR/.git" -prune -o \
    -path "$ROOT_DIR/node_modules" -prune -o \
    -path "$ROOT_DIR/.next" -prune -o \
    -path "$ROOT_DIR/dist" -prune -o \
    -path "$ROOT_DIR/build" -prune -o \
    -type f \
    ! -name '*.md' \
    ! -path "$ROOT_DIR/.gitignore" \
    ! -path "$ROOT_DIR/scripts/validate-agent-fieldbook.sh" \
    ! -path "$ROOT_DIR/tests/security_unit_tests.mjs" \
    ! -path "$ROOT_DIR/tests/security_static_checks.py" \
    -print | sort
)

if [[ ${#implementation_files[@]} -eq 0 ]]; then
  pass "no implementation files detected; spec-and-artifact validation is expected for the current state"
else
  pass "detected ${#implementation_files[@]} implementation file(s) for lightweight smoke validation"
fi

json_files=()
while IFS= read -r file; do
  json_files+=("$file")
done < <(
  find "$ROOT_DIR" \
    -path "$ROOT_DIR/.git" -prune -o \
    -path "$ROOT_DIR/node_modules" -prune -o \
    -path "$ROOT_DIR/.next" -prune -o \
    -path "$ROOT_DIR/dist" -prune -o \
    -path "$ROOT_DIR/build" -prune -o \
    -type f -name '*.json' -print | sort
)

if [[ ${#json_files[@]} -eq 0 ]]; then
  skip "no JSON files found"
elif require_command node; then
  for file in "${json_files[@]}"; do
    if node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'))" "$file"; then
      pass "valid JSON: $(relative_path "$file")"
    else
      fail "invalid JSON: $(relative_path "$file")"
    fi
  done
else
  skip "Node is unavailable; JSON parse checks skipped"
fi

shell_files=()
while IFS= read -r file; do
  shell_files+=("$file")
done < <(
  find "$ROOT_DIR" \
    -path "$ROOT_DIR/.git" -prune -o \
    -path "$ROOT_DIR/node_modules" -prune -o \
    -path "$ROOT_DIR/.next" -prune -o \
    -path "$ROOT_DIR/dist" -prune -o \
    -path "$ROOT_DIR/build" -prune -o \
    -type f \( -name '*.sh' -o -perm -111 \) -print | sort
)

if [[ ${#shell_files[@]} -eq 0 ]]; then
  skip "no shell scripts found"
else
  for file in "${shell_files[@]}"; do
    if head -n 1 "$file" | grep -Eq '(^#!.*sh|^#!/usr/bin/env bash)'; then
      if bash -n "$file"; then
        pass "shell syntax: $(relative_path "$file")"
      else
        fail "shell syntax: $(relative_path "$file")"
      fi
    fi
  done
fi

js_files=()
while IFS= read -r file; do
  js_files+=("$file")
done < <(
  find "$ROOT_DIR" \
    -path "$ROOT_DIR/.git" -prune -o \
    -path "$ROOT_DIR/node_modules" -prune -o \
    -path "$ROOT_DIR/.next" -prune -o \
    -path "$ROOT_DIR/dist" -prune -o \
    -path "$ROOT_DIR/build" -prune -o \
    -type f \( -name '*.js' -o -name '*.mjs' -o -name '*.cjs' \) -print | sort
)

if [[ ${#js_files[@]} -eq 0 ]]; then
  skip "no plain JavaScript files found"
elif require_command node; then
  for file in "${js_files[@]}"; do
    if node --check "$file" >/dev/null; then
      pass "JavaScript syntax: $(relative_path "$file")"
    else
      fail "JavaScript syntax: $(relative_path "$file")"
    fi
  done
else
  skip "Node is unavailable; JavaScript syntax checks skipped"
fi

python_files=()
while IFS= read -r file; do
  python_files+=("$file")
done < <(
  find "$ROOT_DIR" \
    -path "$ROOT_DIR/.git" -prune -o \
    -path "$ROOT_DIR/node_modules" -prune -o \
    -path "$ROOT_DIR/.venv" -prune -o \
    -path "$ROOT_DIR/__pycache__" -prune -o \
    -path "$ROOT_DIR/tests/__pycache__" -prune -o \
    -path "$ROOT_DIR/dist" -prune -o \
    -path "$ROOT_DIR/build" -prune -o \
    -type f -name '*.py' -print | sort
)

if [[ ${#python_files[@]} -eq 0 ]]; then
  skip "no Python files found"
elif require_command python3; then
  if python3 - "${python_files[@]}" <<'PY'
import pathlib
import sys

for filename in sys.argv[1:]:
    source = pathlib.Path(filename).read_text(encoding="utf-8")
    compile(source, filename, "exec")
PY
  then
    pass "Python syntax compile check passed for ${#python_files[@]} file(s)"
  else
    fail "Python syntax compile check failed"
  fi
else
  skip "python3 is unavailable; Python checks skipped"
fi

if [[ -f "$ROOT_DIR/package.json" ]]; then
  if require_command node; then
    package_inspection="$(node - <<'NODE' "$ROOT_DIR/package.json"
const fs = require('fs');
const path = process.argv[2];
const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
const scripts = pkg.scripts || {};
const knownSmoke = ['test', 'smoke', 'test:smoke', 'check', 'validate'].filter((name) => scripts[name]);
console.log(`INFO: package.json name=${pkg.name || '(unnamed)'} scripts=${Object.keys(scripts).join(',') || '(none)'}`);
if (knownSmoke.length) {
  console.log(`INFO: candidate project validation scripts=${knownSmoke.join(',')}`);
} else {
  console.log('INFO: no package.json smoke/test/check script found yet');
}
NODE
)"
    log "$package_inspection"
    pass "package.json metadata inspected"

    if grep -Fq "smoke" <<<"$package_inspection"; then
      if require_command npm; then
        if (cd "$ROOT_DIR" && npm run -s smoke); then
          pass "npm smoke script completed"
        else
          fail "npm smoke script failed"
        fi
      else
        skip "npm is unavailable; package smoke script skipped"
      fi
    fi
  else
    skip "Node is unavailable; package.json metadata inspection skipped"
  fi
fi

log "Checks run: $CHECKS"

if [[ "$FAILURES" -eq 0 ]]; then
  log "Validation result: PASS"
  exit 0
fi

log "Validation result: FAIL ($FAILURES failure(s))"
exit 1
