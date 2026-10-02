"""Fills {{ name }} placeholders in docs pages with values taken from the dashboard's code.

The values come from docs/snippets/generated/values.json, written by
scripts/generate-docs-snippets.ts. An unknown placeholder, or a missing values file, fails the
build instead of publishing a page with a stale or blank value.
"""

import json
import re
from pathlib import Path

from mkdocs.exceptions import PluginError

PLACEHOLDER = re.compile(r"\{\{\s*([a-z_]+)\s*\}\}")
_values: dict = {}


def on_config(config, **kwargs):
    path = Path(config["docs_dir"]) / "snippets" / "generated" / "values.json"
    if not path.exists():
        raise PluginError(
            f"{path} is missing. Run `npx vite-node scripts/generate-docs-snippets.ts` first."
        )
    _values.clear()
    _values.update(json.loads(path.read_text()))
    return config


def on_page_markdown(markdown, page, **kwargs):
    def replace(match):
        name = match.group(1)
        if name not in _values:
            raise PluginError(f"{page.file.src_path}: unknown docs value {{{{ {name} }}}}")
        return str(_values[name])

    return PLACEHOLDER.sub(replace, markdown)
