# 项目现状与进度

项目定位和启动方式见 [README](../README.md)；编码规范见 [开发约定](./development_conventions.md)。
本文档记录“现在做到哪、哪些没做、有哪些已知债务”。

## 当前定位

本项目当前是 **JSON 规范验证用的过渡实现**，不是最终游戏版本。

- 目标是用最小可运行代码验证 JSON 规范能否表达完整玩法；
- 代码实现优先保证与 JSON 规范一对一，便于发现规范缺口；
- Effect、Condition、TargetRef 均有统一解析/分发入口；
- 当前 UI、数值、内容都是验证载体，不追求最终表现；
- 规范稳定后再重构正式游戏与 Editor。

## 规范层次

- 类代码原子：`Condition`、`FormulaNode`，只表达通用判断/计算，不绑定具体游戏业务。
- 过渡层：`AttributeDefinition`，把通用数值/引用转成游戏可用的属性语义。
- 游戏业务原子：`RuleAction`、`EffectCall`，直接表达玩家/NPC/游戏世界可执行的动作与效果。
- `addCard` 属于游戏业务原子效果：只负责生成并放置卡牌，不处理背包容量；超重后果由人物卡规则处理，当前尚未实现。

## 代码组织

- 新代码在 `src/pages/card_story_game/` 下。
- 规范类型在 `card_story_game_types/`，效果类型已按类别拆到 `effect_types/`。
- 游戏原型在 `game/famine_refugee/`。
- 编辑器在 `editor/`，路由入口是 `editor/index.tsx`。
- 旧代码归档在 `archive/card_story_game/`，不参与构建，不要从新代码 import。

## 已完成：规范

- 属性值支持 `number / cardRef / cardRefList`，统一存放在 `CardState.values`。
- `location / carrier / backpack` 是属性，不是 CardState 硬编码字段。
- Condition target 是对象 `{ card, slot? }`；数字比较支持静态 number 或动态 NumberExpression。
- AttributeCheck 支持：
  - `id`：number 属性；
  - `refId` + `refExists`：cardRef；
  - `refListId` + `refListsMatch`：cardRefList。
- `refListsMatch` 支持 `match / count / min / max`，内部使用 `referencedCard`。
- 数字表达式：静态数字直接用 number；动态 Formula 使用 `literal / numberAttributeValue / floor / abs / add / sub / mul / div / clamp / normalize / refListsAttributeCount / refListsAttributeSum`。
- 动态数量：ActionSlot 的 count/min/max、NpcBehavior.decisionInterval、refListsMatch 的 count/min/max 支持 NumberExpression；代码层统一 floor / 非负 / max>=min / decisionInterval>=1。
- Effect 类型已拆分：
  - `attribute_effects.ts`
  - `tag_effects.ts`
  - `template_effects.ts`
  - `card_effects.ts`
  - `location_effects.ts`
  - `item_effects.ts`
  - `effect_types.ts` 统一导出并定义 `EffectKind / InlineEffect / EffectCall`。
- Effect target 和 Condition target 一样使用 `{ card, slot? }` 对象。
- 默认配置 schema 版本为 42。

## 已完成：原型

- 地点：place / passage，玩家 `location` 属性表示当前地点。
- 进入卡：incoming 动作 + `changeLocation`。
- 动作：outgoing 一对多卡槽、incoming 一对一响应。
- 公式：动作时间、属性派生、引用列表统计。
- 标签：state / derived，标签实例和 auto。
- 背包：玩家可拾起、放下、旅行携带；背包物品可参与主动动作卡槽。
- 可操作范围：当前地点公共卡 + 自身背包；他人背包默认不可见不可选。
- 负重：`weight / carryCapacity / carrySlots` 属性，顶部显示负重与背包数量。
- `moveItemCard`：在背包、地点、目标背包之间移动物品，并校验容量。
- `addCard`：默认进入 sourceCard 背包，`to` 可指定地点；不处理容量。
- NPC：模板 `behavior.decisionInterval` 控制决策，动作池复用 `outgoing`；按顺序尝试首个可执行动作。
- 日志：记录玩家和 NPC 行为。
- UI：顶部玩家属性/地点/时间，中央 grid，右侧检查面板，底部日志；顶部和底部固定，中间滚动。

## 编辑器现状

- 标签 / 动作 / 模板三个页面已接入。
- 动作 Drawer 仍保留 `targets` 过渡字段，尚未迁移到新的 slots / 新 target 结构。
- 模板 Drawer 仍是空表单，尚未接入新的模板字段、behavior、属性绑定。
- 属性、标签、公式、Effect 的完整编辑器尚未实现。
- 编辑器和游戏原型共享部分类型，但原型配置尚未并入 `GameConfig`。

## 待做

- 完善 EffectResult / createdCard 设计，决定是否拆分 `addCard + moveItemCard`。
- 实现超重后果（体力损耗、受伤、自动放下等人物规则）。
- 扩展 NPC 行为系统，目前只有按 outgoing 顺序的简单决策。
- 完善编辑器：动作 slots、模板、属性、公式、Effect。
- 正式存档、读档和游戏循环。
- 正式属性面板、技能/升级体系。
- 删除 / 引用保护、导入导出校验。

## 技术债 / 已知例外

- 动作 Drawer 的 `targets` 字段已不再属于新规范，但编辑器仍在读写。
- 模板表单和新 schema 尚未对齐。
- `addCard` 的背包放置不检查容量；`moveItemCard` 仍检查容量，两者语义暂不一致。
- NPC 行为只按 `outgoing` 顺序尝试，没有真正的效用/优先级系统。
- 行为决策挂在 tick 上，NPC 动作耗时只影响下一次决策，不单独推进全局时间。
- `main.tsx` 的 StrictMode 仍处于注释状态。

## 文档分工

- `README.md`：项目入口、启动方式、文档索引。
- `docs/development_conventions.md`：工程规范。
- `docs/project_status.md`：本文档，记录现状与债务。
- `target_ref_contexts.md`：TargetRef 在 Condition / Effect / Formula 中的上下文说明。
- `src/pages/card_story_game/card_story_game.md`：游戏设计笔记，作者本人维护。

## 更新方式

功能完成或状态变化时更新本文档。
