# JSON 规范总览

本文是 `card_story_game` 配置规范的总入口，详细规则见各专项文档。

## 规范层次

- 类代码原子：`Condition`、`FormulaNode`，只表达通用判断/计算，不绑定具体游戏业务。
- 过渡层：`AttributeDefinition`，把通用数值/引用转成游戏可用的属性语义。
- 游戏业务原子：`RuleAction`、`EffectCall`，直接表达玩家/NPC/游戏世界可执行的动作与效果。

## 属性

- 属性值支持 `number / cardRef / cardRefList`，统一存放在 `CardState.values`。
- `AttributeDefinition.valueType` 决定值类型。
- `typeParams.bounds` 是硬上下限，使用 `NumberExpression`，写入时强制夹在范围内。
- `location / carrier / backpack` 是属性，不是 CardState 硬编码字段。

## 数字表达式

- 静态数字直接使用 number。
- 动态计算使用 `FormulaNode`。
- Formula 内部的 `args`、`clamp`、`normalize` 等统一使用 `Formula`；常量使用 `literal`。
- 支持 `literal / numberAttributeValue / numberAttributeBound / floor / abs / add / sub / mul / div / clamp / normalize / refListsAttributeCount / refListsAttributeSum`。
- Condition 的数字比较、ActionSlot 数量、NpcBehavior 间隔、refListsMatch 数量、changeAttributes 的 delta/set 都使用 `NumberExpression`。

## Condition 与 TargetRef

```ts
interface TargetRef {
	card: ConditionTarget;
	slot?: string;
}
```

- `ConditionTarget`：`sourceCard / sourceTag / targetCard / host / slot / referencedCard`。
- `Condition.target` 是 `TargetRef`。
- `AttributeCheck`：
  - `id`：number 属性；
  - `refId` + `refExists`：cardRef；
  - `refListId` + `refListsMatch`：cardRefList。
- 详细说明见 [TargetRef 上下文说明](./target_ref_contexts.md)。

## Effect

- 效果类型按类别拆在 `effect_types/`。
- `EffectTarget` 与 Condition 一样使用 `TargetRef`。
- 单次效果内联；复用效果放 `allEffects` 并用 `{ effectId }` 引用。
- `addCard` 是游戏业务原子效果：创建并放置卡牌，默认进入执行者背包，不处理容量。
- `moveItemCard` 在背包和地点之间移动物品。

## Action

- Action 使用 `slots` 放置目标，不再使用 `targets`。
- 条件和 change 条件使用 action 开始前的快照统一判定。
- 按 `effects` 数组顺序执行，最后统一 removeCard。
- 详细说明见 [Action 执行规范](./action_execution.md)。

## 对话

- `allDialogues` 定义 `DialogueDefinition`。
- `DialogueNode` 使用 `speaker: TargetRef`。
- `DialogueOption` 支持 condition / effects / next。
- `DialogueNode.next` 用于无可见选项时点击空白继续；没有 next 则结束对话。
- `DialogueDefinition.entries` 按条件选择入口节点。
- Condition 保持单卡判定：`hasAgreement` 检查卡牌持有的共识定义，`dialogue` 检查卡牌的全局对话历史。
- 双人判定由两个 Condition 的 AND 表达。
- 条件字段统一为 `condition: ConditionExpression`；支持 `and / or / not`，组合子条件使用 `items`。
- `startDialogue` effect 启动对话；玩家 incoming 默认使用 targetCard，NPC outgoing 可用 slot。
- 对话状态保存 sourceCardId / targetCardId / slotMap。
- 详细触发方式见项目状态与配置案例。

## 共识

- `AgreementDefinition` 第一版只有 `kind: "promise"`。
- 当前定义不包含 parties / terms / 时间限制。
- `FamineState.agreements` 是全局权威 map。
- `CardState.agreementIds` 是参与卡上的索引。
- `createAgreement` 从动作 source/target 创建双方已知、已接受的承诺。
- 不存 active/completed/failed 状态。

## 关系

- 关系是有向边：`sourceCard → targetCard`。
- 关系值挂在 sourceCard 的 `relationships` 映射上：

```ts
interface RelationshipState {
	values: Record<number, number>;
}

interface CardState {
	relationships?: Record<string, RelationshipState>;
}
```

- 关系属性使用 `AttributeDefinition.scope = "relationship"`；默认 `scope` 为 `card`。
- AttributeCheck 支持 `relationshipId + relationship` 检查关系属性。
- `changeRelationshipAttributes` 修改有向关系值。
- 关系懒创建，缺失时按 0 计算。

## NPC

- `CardTemplate.behavior.decisionInterval` 控制决策间隔。
- 动作池复用 `outgoing`，按数组顺序尝试。
- 具体执行仍复用 Action 的原子规则。
