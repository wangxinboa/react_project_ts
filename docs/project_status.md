# 项目现状与进度

项目定位和启动方式见 [README](../README.md)；编码规范见 [开发约定](./development_conventions.md)。
本文档记录“现在做到哪、哪些没做、有哪些已知债务”，不写编码规范。

## 当前阶段

- 编辑器代码已重置：旧实现归档到 `archive/card_story_game/`，不再参与路由和构建。
- 新编辑器已完成 UI 骨架和标签 / 动作 / 模板三个页面：顶栏、左侧菜单、配置加载、Table / 搜索 / 分页 / 编辑 Drawer。
- 模板表单、属性系统、标签 / 动作删除保护之后再逐步补。

## 代码组织现状

- 新代码在 `src/pages/card_story_game/` 下，从编辑器 UI 开始重新搭建。
- 路由入口是 `editor/index.tsx`，路径仍是 `/card_story_game/editor`。
- 旧代码只在 `archive/card_story_game/` 中参考，不要从新代码 import 归档文件。

## 已完成

- 旧代码归档：页面、类型、校验、service 和重置前的项目状态记录。
- 新编辑器路由与 Layout：顶栏、左侧竖向 Menu、中央占位区。
- 编辑器主题：`ConfigProvider` + `darkAlgorithm` + 暖色 token，只作用于编辑器路由。
- 顶栏 UI：配置名输入、导入/导出按钮、标签校验徽章。
- 菜单 UI：标签 / 动作 / 模板三项，选中态写入 URL 的 `page` 参数，刷新 / 直达 / 前进后退都能恢复；非法值回退到标签。
- 设计笔记已复制到新目录 `src/pages/card_story_game/card_story_game.md`。
- 配置加载：Editor 从 `public/card_story_game_default_config.json` 读取完整 JSON，保留未知字段，当前只使用 `allTags`。
- 标签页：Table 列表、key / 描述搜索、分页、新建 / 编辑 Drawer；Drawer 通过 `useImperativeHandle` 暴露 `create()` / `edit(tag)` / `close()`，内部 `mode` 区分新建和编辑，标签数据和表单草稿都在内部；确认后才写回 config，取消不写。
- 标签校验：key 为空 / 重名会计入顶栏状态。
- 动作页：Table 列表、verb / 描述搜索、分页、创建时间列；Drawer 编辑 verb / 描述 / 参数 / targets / conditions / effects，确认后写回 `allRules`，取消不写；动作类型已加入 `allRules`，旧数据缺 desc / createdAt 时加载补默认值。
- 模板页第一版：Table 列表、key / 描述搜索、分页、标签数 / 自动规则 / 主动规则 / 响应规则 / 创建时间列、新建 / 编辑打开空 Drawer；`cardTemplates` 已加入类型和加载兜底，模板表单等属性系统完成后再做。
- 前端分页：`useClientPagination` 统一页码 / pageSize / 总数 / 当前页 / 切片 / 重置；TagPage、ActionPage 共用，Pagination JSX 仍留在页面。
- 标签时间：`createdAt` 使用毫秒时间戳，列表按最新优先排序，Table 展示 `YYYY-MM-DD HH:mm:ss`；新建后回第一页并清空搜索；旧数据缺失 `createdAt` 时加载补当前时间。

## 待做

- 数据层：逐步补齐动作 / 模板 / 属性的类型、解析和校验。
- 标签删除：等模板引用存在后实现引用保护。
- 动作校验：verb / 参数名 / JSON 数组问题接入顶栏与导出保护。
- 模板 Drawer：key / 描述 / 标签 / 动作组 / 属性绑定表单。
- 属性系统：全局属性定义、模板属性绑定、params、字段类型。
- 顶栏导入导出、校验计数。
- 游戏本体页面。

## 当前数据状态

- `public/card_story_game_default_config.json` 现在是新编辑器实际读取的数据源，标签已带 `createdAt`；其他字段原样保留，后续页面逐步接入。
- 文件里仍有重置前的动作 / 模板字段，新编辑器会原样保留；后续页面再逐步接入和收窄类型。

## 设计参考

- 重置前的表单、校验、树组件和属性讨论记录在 `archive/card_story_game/` 与 `project_status_before_reset.md`，可作为设计参考，但新代码不直接依赖。
- 后续新决策重新记录，不继承旧实现里的“已完成”状态。

## 技术债 / 现状例外

- 顶栏的导入 / 导出按钮目前只有 UI，没有行为。
- 标签 / 动作删除暂未实现；等模板引用存在后补引用保护。
- 动作表单的 card 参数仍显示默认值输入框，提交时会被忽略；后续可按类型隐藏。
- 标签表格默认每页 5 条，可在 5 / 10 / 20 / 50 之间切换。
- 模板 Drawer 目前是空组件，新建 / 编辑还不会写回 config。
- `main.tsx` 的 StrictMode 仍处于注释状态，如果不是临时调试建议恢复。

## 文档分工

- `README.md`：项目入口，只放概览、启动方式和文档索引。
- `docs/development_conventions.md`：工程规范，只写“以后该怎么做”。
- `docs/project_status.md`：本文档，只写“现在做到哪”。
- `src/pages/card_story_game/card_story_game.md`：游戏设计笔记，作者本人维护，代码改动不自动修改它。

## 更新方式

- 功能完成或状态变化时更新本文档。
