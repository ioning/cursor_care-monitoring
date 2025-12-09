from __future__ import annotations

import re
from pathlib import Path


STRUCTURE_FILE = Path("vision_structure.md")
BASE_DIR = Path(".")


def main() -> None:
    if not STRUCTURE_FILE.exists():
        raise FileNotFoundError(f"Structure file not found: {STRUCTURE_FILE}")

    stack: list[Path] = []

    for raw_line in STRUCTURE_FILE.read_text(encoding="utf-8").splitlines():
        line = raw_line.rstrip()
        if not line.strip():
            continue

        cleaned = line.replace("│", "│")
        indent, entry = extract_entry(cleaned)
        if not entry:
            continue
        if any(ch in entry for ch in {"│", "├", "└"}):
            continue

        while len(stack) > indent:
            stack.pop()

        current_dir = stack[-1] if stack else BASE_DIR

        if entry.endswith("/"):
            dir_path = current_dir / entry.rstrip("/")
            dir_path.mkdir(parents=True, exist_ok=True)
            stack.append(dir_path)
        else:
            file_path = current_dir / entry
            file_path.parent.mkdir(parents=True, exist_ok=True)
            if not file_path.exists():
                write_placeholder(file_path)


def extract_entry(line: str) -> tuple[int, str | None]:
    if set(line.strip()) == {"│"}:
        return 0, None

    if "── " in line:
        prefix, entry = line.split("── ", 1)
        indent = len(re.findall(r"(?:│   |    )", prefix))
        if prefix.strip().startswith(("├", "└")):
            indent += 1
    else:
        entry = line.strip()
        indent = 0

    entry = entry.split("#", 1)[0].strip()
    if not entry:
        return indent, None

    return indent, entry


def write_placeholder(path: Path) -> None:
    content = placeholder_content(path)
    if content is None:
        path.touch()
        return

    if path.suffix == ".sh":
        path.write_text(content, encoding="utf-8")
        path.chmod(path.stat().st_mode | 0o111)
        return

    path.write_text(content, encoding="utf-8")


def placeholder_content(path: Path) -> str | None:
    name = path.name
    suffix = path.suffix.lower()

    if name == "Dockerfile":
        return "FROM alpine:3.19\n# TODO: Configure Dockerfile\n"

    if name in {".gitignore", ".dockerignore"}:
        return "# Placeholder ignore rules\n"

    if name == ".env.example":
        return "# Placeholder environment variables\n"

    if suffix in {".ts", ".js"}:
        return "// TODO: Implement according to project vision.\n"

    if suffix == ".tsx":
        return (
            "import React from 'react';\n\n"
            "export default function Placeholder() {\n"
            "  return null;\n"
            "}\n"
        )

    if suffix == ".vue":
        return (
            "<template>\n"
            "  <div class=\"placeholder\">TODO: Implement component</div>\n"
            "</template>\n\n"
            "<script setup lang=\"ts\">\n"
            "// TODO: component logic\n"
            "</script>\n\n"
            "<style scoped>\n"
            "/* TODO: component styles */\n"
            "</style>\n"
        )

    if suffix == ".json":
        if name == "package.json":
            package_name = path.parent.name or "root"
            return (
                "{\n"
                f'  "name": "{package_name}",\n'
                '  "version": "0.1.0"\n'
                "}\n"
            )
        return "{\n}\n"

    if suffix in {".yml", ".yaml"}:
        return "# TODO: Define configuration\n"

    if suffix == ".md":
        title = path.stem.replace("-", " ").title()
        return f"# {title}\n\nTODO: Add documentation content.\n"

    if suffix == ".sql":
        return "-- TODO: Define SQL statements\n"

    if suffix == ".sh":
        return "#!/bin/bash\n\n# TODO: Implement script\n"

    if suffix in {".css"}:
        return "/* TODO: Define styles */\n"

    if suffix in {".lock", ".ico", ".png", ".jpg", ".jpeg", ".mp4", ".woff2", ".ttf"}:
        return None

    if suffix == ".ico":
        return None

    if suffix == ".env":
        return "# Placeholder environment variables\n"

    if name.endswith(".env.example"):
        return "# Placeholder environment variables\n"

    return "// TODO: Pending implementation\n"


if __name__ == "__main__":
    main()



