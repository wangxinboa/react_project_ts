# 项目现状与进度

项目定位和启动方式见 [README](../README.md)；编码规范见 [开发约定](./development_conventions.md)。
本文档记录“现在做到哪、哪些没做、有哪些已知债务”，不写编码规范。

## 当前阶段

- 编辑器代码已重置：旧实现归档到 `archive/card_story_game/`，不再参与路由和构建。
- 新编辑器已完成标签 / 动作 / 模板三个页面，以及多卡属性联动原型。
- 模板表单、属性系统、复杂目标交互、标签 / 动作删除保护之后再逐步补。

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
- 属性联动原型：`/card_story_game/game/famine_refugee` 已改为配置驱动，读取 `public/famine_refugee_config.json`。配置使用 `allTags / allAttributes / allRules / cardTemplates / saveData` 超集，包含属性公式、模板参数、标签规则、tick、模板改写和多卡场景。
- 公式系统：AST 独立到 `card_story_game/formula/`，统一使用 `number / attr / param / add / sub / mul / div / clamp / normalize`；移除 `weightedSum`，加载时校验公式。
- 多卡原型：场景卡可切换，玩家 outgoing 动作按 `conditions` 过滤展示；`targets` 为空直接执行，非空时进入目标放置；执行按钮根据放置的卡牌动态显示。
- incoming：选中其他卡时展示其模板 `incoming` 动作；source 是玩家、target 是选中卡；效果通过 `target: source / target` 分别作用双方。
- 桌面布局：玩家头像左上，场景卡中央 grid，右侧检查面板，底部经历日志；点击头像 / 卡牌切换检查对象。
- 卡槽：动作使用命名 `slots` 取代 targets；每个 slot 有 id / desc / 数量条件，玩家把 grid 卡拖入或点击放入指定 slot；槽位间不能复用卡牌，全部满足后才出现执行按钮。放置中的卡离开 grid，取消或切换选择会回到 grid。
- 卡牌增删：`allEffects` 支持 `addCard` / `removeCard`；work 生成面包，面包 incoming 的 consume 会移除目标卡。场景卡使用 2:3 宽高比。
- 标签分类：`state` 标签存在卡牌实例上，由 `addTag` / `removeTag` 改变；`derived` 标签每次由 tag 内规则计算。
- 标签实例：state 标签通过 `{ id, value }` 绑定 `allAttributes`，可带 `auto`；卡牌 `tags` 存 `{ tagId, values }`，tag auto 在卡牌 auto 之后按整点执行，支持 `tag` / `host` 作用域。
- 条件规范：Condition 改为数组，每项用 `target: source / host / slot` 指定判断对象；attributes 为 `{ id, ... }` 数组；支持 hasTag(s)、hasAnyTag、onlyHasTag(s)、hasAnyTemplate。条件数组为 AND。
- 标签规则：derived 标签直接使用 `conditions` 数组，属性与 `hasAnyTemplate` 在同一条件对象内 AND；不再有 rules/templateIds。
- 效果规范：effect 用 `target: source / host / slot` 指定作用对象；`changeAttributes` 使用 changes 数组；effect 自身可带 conditions 数组。
- 动作发起：当前 UI 只有玩家作为 source；规则不再使用 incoming，面包只能由玩家 outgoing 选中并放入卡槽。
- 效果库：`allEffects` 定义可复用效果，动作 effects 支持内联或 `{ effectId }`；`changeTemplate` 也做成效果，不再有 `templateRules` 根字段。
- 动作时间：使用游戏分钟数，`saveData.time` 为当前分钟；动作 `timeCost` 支持分钟数字或公式，执行前计算。work 使用 `240 + (100 - 体力) × 1.5` 分钟，其他动作固定分钟。每跨过一个整点，所有卡牌执行各自模板的 `auto`；`tick` 只保留全局时间日志和默认文案。
- 默认配置已迁移模板属性为 `{ id, value, params }` 绑定，并增加 `allAttributes`。
- 前端分页：`useClientPagination` 统一页码 / pageSize / 总数 / 当前页 / 切片 / 重置；TagPage、ActionPage 共用，Pagination JSX 仍留在页面。
- 标签时间：`createdAt` 使用毫秒时间戳，列表按最新优先排序，Table 展示 `YYYY-MM-DD HH:mm:ss`；新建后回第一页并清空搜索；旧数据缺失 `createdAt` 时加载补当前时间。

## 待做

- 数据层：逐步补齐动作 / 模板 / 属性的类型、解析和校验。
- 标签删除：等模板引用存在后实现引用保护。
- 动作校验：verb / 参数名 / JSON 数组问题接入顶栏与导出保护。
- 模板 Drawer：key / 描述 / 标签 / 动作组 / 属性绑定表单。
- 放置目标后续补充：目标卡消耗、效果作用于目标、`targets` 多条件组合。
- incoming 后续补充：source 条件、目标消耗 / 移除、复杂多目标响应。
- 属性系统：全局属性定义、模板属性绑定、params、字段类型。
- 顶栏导入导出、校验计数。
- 属性系统与运行时数据结构落地后，再将原型迁移为正式游戏页面。

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
- 饥荒流民原型使用独立 JSON，尚未进入编辑器的 GameConfig；多卡场景依赖 `saveData`，正式存档结构还没定。
- 主动动作默认效果作用于 source；目标卡通过命名 slots 放置，效果可以按 slot 逐个应用或移除；当前不再使用 incoming，auto 动作按卡牌自身作用。
- 属性定义中的 number 专属参数集中在 `typeParams`（min / max）；初始值由模板 / 标签绑定提供，`tone` 已移除。
- `main.tsx` 的 StrictMode 仍处于注释状态，如果不是临时调试建议恢复。

## 文档分工

- `README.md`：项目入口，只放概览、启动方式和文档索引。
- `docs/development_conventions.md`：工程规范，只写“以后该怎么做”。
- `docs/project_status.md`：本文档，只写“现在做到哪”。
- `src/pages/card_story_game/card_story_game.md`：游戏设计笔记，作者本人维护，代码改动不自动修改它。

## 更新方式

- 功能完成或状态变化时更新本文档。
