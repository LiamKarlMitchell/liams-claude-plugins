from __future__ import annotations

from dataclasses import dataclass, field
from typing import Iterable


@dataclass(frozen=True)
class Plugin:
    name: str
    description: str
    category: str
    version: str = "1.0.0"
    author: str = "Liam Karl Mitchell"
    tags: tuple[str, ...] = field(default_factory=tuple)

    @property
    def slug(self) -> str:
        return self.name.lower().replace(" ", "-")


class PluginRegistry:
    """Simple in-memory registry for plugin metadata."""

    def __init__(self, plugins: Iterable[Plugin] | None = None):
        self._plugins: dict[str, Plugin] = {}
        for plugin in plugins or ():
            self.add_plugin(plugin)

    def add_plugin(self, plugin: Plugin) -> None:
        self._plugins[plugin.slug] = plugin

    def remove_plugin(self, name: str) -> None:
        key = name.lower().replace(" ", "-")
        self._plugins.pop(key, None)

    def list_plugins(self) -> list[Plugin]:
        return sorted(self._plugins.values(), key=lambda p: p.name.lower())

    def get_plugin(self, name: str) -> Plugin | None:
        key = name.lower().replace(" ", "-")
        return self._plugins.get(key)

    def search(self, query: str) -> list[Plugin]:
        q = query.lower()
        return [
            plugin
            for plugin in self.list_plugins()
            if q in plugin.name.lower()
            or q in plugin.description.lower()
            or any(q in tag.lower() for tag in plugin.tags)
        ]

    def as_dict(self) -> list[dict[str, object]]:
        return [
            {
                "name": plugin.name,
                "description": plugin.description,
                "category": plugin.category,
                "version": plugin.version,
                "author": plugin.author,
                "tags": list(plugin.tags),
            }
            for plugin in self.list_plugins()
        ]


def get_default_registry() -> PluginRegistry:
    return PluginRegistry(
        [
            Plugin(
                name="Git Review",
                description="Reviews git diffs and suggests follow-up improvements.",
                category="productivity",
                version="1.0.0",
                tags=("git", "review", "code"),
            ),
            Plugin(
                name="Release Notes",
                description="Generates concise release notes from commit history.",
                category="documentation",
                version="1.0.0",
                tags=("release", "notes", "docs"),
            ),
            Plugin(
                name="Security Scan",
                description="Highlights risky patterns and summarizes security issues.",
                category="security",
                version="1.1.0",
                tags=("security", "scan", "audit"),
            ),
        ]
    )
