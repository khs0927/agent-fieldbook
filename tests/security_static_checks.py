#!/usr/bin/env python3
"""Local security/privacy checks for Agent Fieldbook.

The app did not exist when these baseline controls were created, so this script
acts as an early guardrail. It intentionally uses only the Python standard
library and can be run from the project root with:

    python3 tests/security_static_checks.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]

IGNORED_DIRS = {
    ".git",
    ".hg",
    ".svn",
    "__pycache__",
    ".pytest_cache",
    ".mypy_cache",
    ".ruff_cache",
    ".venv",
    "venv",
    "node_modules",
    "dist",
    "build",
    "coverage",
    ".next",
    ".turbo",
}

SOURCE_EXTENSIONS = {
    ".cjs",
    ".cts",
    ".go",
    ".js",
    ".jsx",
    ".mjs",
    ".mts",
    ".py",
    ".rs",
    ".ts",
    ".tsx",
}

FORBIDDEN_PROJECT_FILES = {
    ".env",
    ".env.local",
    ".env.development",
    ".env.production",
    "id_rsa",
    "id_dsa",
    "id_ecdsa",
    "id_ed25519",
}

FORBIDDEN_SUFFIXES = {
    ".key",
    ".pem",
    ".p12",
    ".pfx",
    ".sqlite",
    ".sqlite3",
    ".db",
}

REQUIRED_FILES = [
    "SECURITY.md",
    "security/implementation-notes.md",
]

REQUIRED_IGNORE_PATTERNS = [
    ".env",
    "*.key",
    "*.pem",
    "*.sqlite",
    "*.sqlite3",
    "*.db",
    "diagnostics/",
    "logs/",
    "tmp/",
    "cache/",
]

SECRET_PATTERNS = [
    re.compile(r"(?i)(api[_-]?key|secret|token|password|private[_-]?key)\s*[:=]\s*['\"][^'\"\s]{12,}['\"]"),
    re.compile(r"-----BEGIN (?:RSA |DSA |EC |OPENSSH |)PRIVATE KEY-----"),
    re.compile(r"(?i)authorization\s*[:=]\s*['\"]bearer\s+[^'\"\s]{12,}['\"]"),
]

RAW_PROMPT_LOG_PATTERNS = [
    re.compile(r"(?i)console\.(?:log|debug|info|warn|error)\s*\([^)]*(raw_?prompt|prompt|raw_?response|model_?response)"),
    re.compile(r"(?i)logger\.(?:debug|info|warn|error|exception)\s*\([^)]*(raw_?prompt|prompt|raw_?response|model_?response)"),
    re.compile(r"(?i)print\s*\([^)]*(raw_?prompt|prompt|raw_?response|model_?response)"),
]


def iter_project_files() -> list[Path]:
    files: list[Path] = []
    for path in PROJECT_ROOT.rglob("*"):
        if any(part in IGNORED_DIRS for part in path.relative_to(PROJECT_ROOT).parts):
            continue
        if path.is_file():
            files.append(path)
    return files


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return ""


def check_required_files(errors: list[str]) -> None:
    for relative in REQUIRED_FILES:
        if not (PROJECT_ROOT / relative).is_file():
            errors.append(f"Missing required security file: {relative}")


def check_forbidden_files(files: list[Path], errors: list[str]) -> None:
    for path in files:
        relative = path.relative_to(PROJECT_ROOT)
        if path.name in FORBIDDEN_PROJECT_FILES:
            errors.append(f"Forbidden local secret/config file is present: {relative}")
        if path.suffix.lower() in FORBIDDEN_SUFFIXES:
            errors.append(f"Forbidden local secret/database artifact is present: {relative}")


def check_ignore_rules(errors: list[str]) -> None:
    ignore_file = PROJECT_ROOT / ".gitignore"
    if not ignore_file.is_file():
        errors.append("Missing .gitignore with local secret/cache/database exclusions")
        return

    ignore_text = read_text(ignore_file)
    for pattern in REQUIRED_IGNORE_PATTERNS:
        if pattern not in ignore_text:
            errors.append(f".gitignore is missing required pattern: {pattern}")


def check_source_patterns(files: list[Path], errors: list[str]) -> None:
    for path in files:
        if path.suffix.lower() not in SOURCE_EXTENSIONS:
            continue
        if path == Path(__file__).resolve():
            continue
        if path.relative_to(PROJECT_ROOT).parts[0] == "tests":
            continue

        text = read_text(path)
        if not text:
            continue

        relative = path.relative_to(PROJECT_ROOT)
        for pattern in SECRET_PATTERNS:
            if pattern.search(text):
                errors.append(f"Possible hardcoded secret in source file: {relative}")
                break

        for pattern in RAW_PROMPT_LOG_PATTERNS:
            if pattern.search(text):
                errors.append(f"Possible raw prompt/response logging in source file: {relative}")
                break


def main() -> int:
    errors: list[str] = []
    files = iter_project_files()

    check_required_files(errors)
    check_forbidden_files(files, errors)
    check_ignore_rules(errors)
    check_source_patterns(files, errors)

    if errors:
        print("Security checks failed:")
        for error in errors:
            print(f" - {error}")
        return 1

    print("Security checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
