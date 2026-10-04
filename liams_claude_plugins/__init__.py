"""Public package interface for the Claude plugin marketplace."""

from .marketplace import Plugin, PluginRegistry, get_default_registry

__all__ = ["Plugin", "PluginRegistry", "get_default_registry"]
