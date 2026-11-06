# 项目现状与进度

项目定位和启动方式见 [README](../README.md)；编码规范见 [开发约定](./development_conventions.md)。

## 当前定位

本项目当前是 **JSON 规范验证用的过渡实现**，不是最终游戏版本。

- 用最小可运行代码验证 JSON 规范能否表达完整玩法；
- 代码实现优先与 JSON 规范一对一；
- UI、数值、内容都是验证载体；
- 规范稳定后再重构正式游戏与 Editor。

## JSON 规范

规范文档已集中到：

[card_story_game_types/docs](../src/pages/card_story_game/card_story_game_types/docs/card_story_game_types.md)

- [规范总览](../src/pages/card_story_game/card_story_game_types/docs/schema_overview.md)
- [TargetRef 上下文](../src/pages/card_story_game/card_story_game_types/docs/target_ref_contexts.md)
- [Action 执行规范](../src/pages/card_story_game/card_story_game_types/docs/action_execution.md)

## 代码组织

- 规范类型：`card_story_game_types/`。
- 效果类型：`card_story_game_types/effect_types/`。
- 游戏原型：`game/famine_refugee/`。
- 编辑器：`editor/`，路由入口是 `editor/index.tsx`。
- 旧代码：`archive/card_story_game/`，不参与构建。

## 已完成：原型

- 地点：place / passage，玩家 `location` 属性表示当前地点。
- 进入卡：incoming + `changeLocation`。
- 动作：outgoing 一对多卡槽、incoming 一对一响应。
- 公式：动作时间、属性派生、引用列表统计、属性硬边界读取。
- 标签：state / derived，标签实例和 auto。
- 背包：拾起、放下、旅行携带；背包物品可参与主动动作卡槽。
- 可操作范围：当前地点公共卡 + 自身背包；他人背包默认不可见不可选。
- 负重：`weight / carryCapacity / carrySlots`，顶部显示负重与背包数量。
- `moveItemCard`：在背包、地点、目标背包之间移动物品，并校验容量。
- `addCard`：默认进入 sourceCard 背包，`to` 可指定地点，不处理容量。
- NPC：`behavior.decisionInterval` 控制决策，动作池复用 `outgoing`。
- 对话：`allDialogues` + `startDialogue` + 全屏遮罩底部对话条；玩家选中 NPC 的「交谈」incoming 触发，节点支持 speaker / conditions / effects / next；对话期间暂停玩家动作和 NPC 行为。
- 日志：记录玩家和 NPC 行为。
- UI：顶部玩家属性/地点/时间，中央 grid，右侧检查面板，底部日志。
- 动作预览：悬浮 action 时用克隆状态只读执行，显示属性、背包、时间变化。

## 编辑器现状

- 标签 / 动作 / 模板三个页面已接入。
- 动作 Drawer 仍保留 `targets` 过渡字段，尚未迁移到 slots / 新 target 结构。
- 模板 Drawer 尚未接入新的模板字段、behavior、属性绑定。
- 属性、公式、Effect 的完整编辑器尚未实现。
- 原型配置尚未并入 `GameConfig`。

## 待做

- 完善 EffectResult / createdCard 设计。
- 超重后果（体力损耗、受伤、自动放下）的人物规则。
- 扩展 NPC 行为系统。
- 编辑器：动作 slots、模板、属性、公式、Effect。
- 正式存档、读档和游戏循环。
- 正式属性面板、技能/升级体系。
- 删除 / 引用保护、导入导出校验。

## 技术债 / 已知例外

- 动作 Drawer 的 `targets` 字段已不属于新规范，但编辑器仍在读写。
- 模板表单和新 schema 尚未对齐。
- `addCard` 不检查容量；`moveItemCard` 检查容量，两者语义暂不一致。
- NPC 行为只按 `outgoing` 顺序尝试，没有真正的效用/优先级系统。
- 行为决策挂在 tick 上，NPC 动作耗时只影响下一次决策，不单独推进全局时间。
- Tag auto 仍按自身顺序执行，不受 Action 原子规则约束。
- `main.tsx` 的 StrictMode 仍处于注释状态。
