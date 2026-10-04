# liams-claude-plugins

Claude Code plugin marketplace with plugins for working with [OpenSpec](https://github.com/Fission-AI/OpenSpec).

## Install

```
/plugin marketplace add LiamKarlMitchell/liams-claude-plugins
/plugin install task-progress-hud@liams-claude-plugins
```

## Plugins

| Plugin                                                  | Description                                                                                                                                     |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| [task-progress-hud](plugins/openspec/task-progress-hud) | Shows done, percent and remaining tasks of the current OpenSpec change in `tasks.md`. Adds a band above the prompt and a `/task-progress` pane. |

## Layout

```
.claude-plugin/marketplace.json   marketplace manifest
plugins/domain/<name>/            one directory per plugin
openspec/                         specs and change history for these plugins
```
