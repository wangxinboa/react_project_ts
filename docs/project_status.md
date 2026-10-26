# 项目现状与进度

项目定位和启动方式见 [README](../README.md)；编码规范见 [开发约定](./development_conventions.md)。
本文档记录“现在做到哪、哪些没做、有哪些已知债务”，不写编码规范。

## 当前阶段

- 先做配置编辑器，游戏本体后做。
- 编辑器目前覆盖“标签 + 动作库”两层。
- `cardTemplates` 还没有编辑界面，但会随配置原样保留。

## 代码组织现状

- 专项业务模块（类型、校验、编辑器）与页面一起放在 `src/pages/card_story_game/` 下。
- 后续游戏页面也放在该业务目录内（如 `game/`），不把类型和校验上提到 `src/` 顶层。

## 已完成

- 路由：HashRouter + `pages/**/index.tsx` 自动注册，子组件不会变成野路由。
- 编辑器骨架：顶栏、左右两栏 Splitter、暗色样式。
- 标签：新增 / 删除 / 重命名 / 描述编辑，`id` 唯一标识，选中态跟随 `id`。
- 动作库：左树分组、动作新增 / 删除 / 选中；表单编辑 `verb`、参数、targets / conditions / effects（JSON 文本域）；删除被模板引用的动作会阻止并列出引用方。
- 数据加载：从 `public/card_story_game_default_config.json` 读取完整 `GameConfig`，按 `BASE_URL` 拼路径；加载完成前显示 Spin 并禁用导入导出。
- 导入导出：纯 JSON、全量覆盖；缺失 / 重复标签 `id` 自动补号；动作和模板随配置完整保留。
- 校验：结构校验阻断加载与导入；标签语义校验（空 key、重名）只提示，并在顶栏计数。
- 数据模型：`allRules` 是全局动作库（id / verb / params / targets / conditions / effects），`cardTemplates` 只保存动作 id 引用；动作 id、模板引用、标签引用和字段初始值都会做结构校验。
- 编辑器主题：编辑器路由层包 ConfigProvider + `darkAlgorithm` + 暖色 token，Modal / message 通过 `App.useApp()` 继承主题；首页和后续游戏页不受影响。

## 待做

- 规则编辑器：targets / conditions / effects 目前是 JSON 文本域，待结构化编辑与 AST 校验。
- 卡牌模板编辑器。
- 右侧预览与完整校验（引用存在性、字段完整性）。
- 游戏本体页面。

## 当前数据状态

- `public/card_story_game_default_config.json` 目前是标签测试数据，不是最终游戏内容。
- 标签空 key / 重名会让顶栏显示错误，这是语义校验的预期行为，不阻断加载。

## 决策记录

状态只分两种：「已定」是聊过并达成一致的；「待定」是还没结论、先按现状走的。
待定项不要当成规范引用。

| 事项 | 结论 | 状态 | 理由 | 重新评估的时机 |
|---|---|---|---|---|
| DEV 守卫（线上隐藏编辑器） | 不做 | 已定 | 编辑器将来也要给玩家做故事，不只是开发工具 | 需要区分“玩家版 / 创作版”时 |
| 草稿保存 / localStorage | 不做 | 已定 | 目前只有导出，没有保存概念 | 编辑时间长到怕刷新丢失时 |
| 标签 `category` | 暂不引入 | 已定 | 现在没有使用场景，加了也是空字段 | 需要标签分组或互斥语义时 |
| antd Form | 采用：Form 持输入态，`tags` 是模型，校验仍在 validate | 已定 | 统一表单外观与交互，并为规则/模板表单立模式；双状态用 `onValuesChange` + `key` 重挂载控制 | 规则/模板的嵌套数组表单（Form.List）落地时再评估 |
| 右侧预览 / 完整校验 | 暂时移除占位，等规则和模板落地再做 | 已定 | 占位没有实际内容，先让编辑区占满宽度 | 卡牌模板编辑器落地后 |
| 模块化拆分 / 冲突检测 / 版本迁移 | 不做 | 已定 | 单文件阶段没必要提前设计 | 配置文件大到单文件难维护时 |
| 撤销 / 重做 | 尚未讨论 | 待定 | 实现成本高，当前编辑量小 | 误操作开始造成实际损失时 |

## 技术债 / 现状例外

以下是**当前状态，不是规范**，改到相关代码时顺手收敛即可：

- `file_import.tsx` 里还有 `as string` 断言，可改为 `typeof` 判断；
- Splitter 的分割线 / 折叠按钮仍靠 `editor.module.scss` 的 `:global` 覆盖，等组件 token 能覆盖时再收敛；
- 中栏底部的“标签 / 动作 JSON”是临时放置，右侧预览做出来后可能迁移；
- `cardTemplates` 还没有编辑界面；`allRules` 可编辑，但 targets / conditions / effects 仍是 JSON 文本域，只校验“合法 JSON 数组”，不校验 AST 语义；
- 动作表单暂不阻止空 `verb` 或重名参数，导出后可能被导入校验拒绝；
- 顶栏的 `warningCount` 还没有产生来源，语义问题目前都记为 error。

## 文档分工

- `README.md`：项目入口，只放概览、启动方式和文档索引。
- `docs/development_conventions.md`：工程规范，只写“以后该怎么做”。
- `docs/project_status.md`：本文档，只写“现在做到哪”。
- `src/pages/card_story_game/card_story_game.md`：游戏设计笔记，作者本人维护，代码改动不自动修改它。

## 更新方式

- 功能完成或状态变化时更新本文档。
- 业务实现细节变化时，以代码和注释为准；需要跨文件说明时再补业务文档。
- 涉及工程约定的改动先讨论，确认后同时更新 `development_conventions.md` 和代码。
