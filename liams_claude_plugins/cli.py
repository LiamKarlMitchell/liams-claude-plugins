from __future__ import annotations

import argparse
import json

from .marketplace import get_default_registry


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="List and inspect Claude Code plugins.")
    subparsers = parser.add_subparsers(dest="command")

    list_parser = subparsers.add_parser("list", help="List available plugins")
    list_parser.set_defaults(handler=_handle_list)

    show_parser = subparsers.add_parser("show", help="Show a plugin by name")
    show_parser.add_argument("name", help="Plugin name or slug")
    show_parser.set_defaults(handler=_handle_show)

    search_parser = subparsers.add_parser("search", help="Search for plugins")
    search_parser.add_argument("query", help="Search term")
    search_parser.set_defaults(handler=_handle_search)

    return parser


def _handle_list(args: argparse.Namespace) -> int:
    registry = get_default_registry()
    for plugin in registry.list_plugins():
        print(f"{plugin.name} ({plugin.category}) - {plugin.description}")
    return 0


def _handle_show(args: argparse.Namespace) -> int:
    registry = get_default_registry()
    plugin = registry.get_plugin(args.name)
    if plugin is None:
        print(f"Plugin '{args.name}' not found.")
        return 1
    print(json.dumps({
        "name": plugin.name,
        "description": plugin.description,
        "category": plugin.category,
        "version": plugin.version,
        "author": plugin.author,
        "tags": list(plugin.tags),
    }, indent=2, sort_keys=True))
    return 0


def _handle_search(args: argparse.Namespace) -> int:
    registry = get_default_registry()
    matches = registry.search(args.query)
    if not matches:
        print(f"No plugins match '{args.query}'.")
        return 1
    for plugin in matches:
        print(f"{plugin.name} - {plugin.category}")
    return 0


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    if not hasattr(args, "handler"):
        parser.print_help()
        return 0
    return args.handler(args)


if __name__ == "__main__":
    raise SystemExit(main())
