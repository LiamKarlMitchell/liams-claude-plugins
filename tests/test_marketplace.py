from liams_claude_plugins import Plugin, PluginRegistry, get_default_registry


def test_registry_list_contains_expected_plugins():
    registry = get_default_registry()
    plugins = registry.list_plugins()

    assert [plugin.name for plugin in plugins] == [
        "Git Review",
        "Release Notes",
        "Security Scan",
    ]


def test_plugin_lookup_by_name_and_slug():
    registry = get_default_registry()

    assert registry.get_plugin("git review").name == "Git Review"
    assert registry.get_plugin("security-scan").name == "Security Scan"
    assert registry.get_plugin("missing") is None


def test_registry_can_add_and_search_plugins():
    registry = PluginRegistry()
    registry.add_plugin(Plugin(name="Docs Helper", description="Helps with docs", category="documentation", tags=("docs", "writing")))

    assert registry.get_plugin("Docs Helper").description == "Helps with docs"
    assert [plugin.name for plugin in registry.search("docs")] == ["Docs Helper"]
