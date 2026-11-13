# JSON 规范总览

本文是 `card_story_game` 配置规范的总入口，详细规则见各专项文档。

## 规范层次

- 类代码原子：`Condition`、`FormulaNode`，只表达通用判断/计算，不绑定具体游戏业务。
- 过渡层：`AttributeDefinition`，把通用数值/引用转成游戏可用的属性语义。
- 游戏业务原子：`RuleAction`、`EffectCall`，直接表达玩家/NPC/游戏世界可执行的动作与效果。

## 属性

- 属性值支持 `number / cardRef / cardRefList`，统一存放在 `CardState.values`。
- `AttributeDefinition.valueType` 决定值类型。
- 属性上限由派生上限属性和 Reaction 共同实现；不再使用 `NumberBounds`。
- `location / carrier / backpack` 是属性，不是 CardState 硬编码字段。

## 属性存在性

- `card.values` 中存在 key 表示属性存在。
- derived 属性用值为 0 的 key 表示存在，具体数值由 `deriveCard` 计算。
- `AttributeCheck.hasAttribute` / `hasAttributes` / `hasAnyAttribute` 只判断存在，不判断数值。
- `addAttribute` effect 用于让属性开始存在。

## 数字表达式

- 静态数字直接使用 number。
- 动态计算使用 `FormulaNode`。
- Formula 内部的 `args`、`clamp`、`normalize` 等统一使用 `Formula`；常量使用 `literal`。
- 支持 `literal / numberAttributeValue / floor / abs / add / sub / mul / div / clamp / normalize / refListsAttributeCount / refListsAttributeSum / select`。
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
- `Condition`、`ConditionGroup`、`ConditionNot` 都支持 `desc`，仅给编辑者阅读，不参与运行时判断。
- `Condition.dialogues` / `agreements` 是数组，数组内按 AND 判断。
- `Condition.worldTime` 使用 `BaseNumberCheck` 判断世界时间（分钟）；`target` 可省略，但不能在没有 target 时写卡牌判定字段。
- `Formula.select` 使用 `branches: [{ condition, value }]` 按顺序匹配，首个成立分支生效；都不成立时使用 `else`，没有 `else` 返回 0。
- 当前核心属性：生命力、灵性、气血上限、气血控制上限、气血失控、武道意志、精神力上限、灵性法术容量上限、法力上限、灵性占用、生命力占用、灵性余量、生命力余量。
- 生命力、灵性为 base；其余进阶属性为 derived，并由 `addAttribute` 按门槛显化。
- 生命力 >= 6 显化气血上限、武道意志；灵性 >= 6 显化精神力上限、法术容量上限；两者都 >= 6 才显化资源/余量属性。
- UI 平铺显示已存在的属性，不按属性树分组。
- 上限属性是普通派生属性；`NumberBounds` / `typeParams` / `numberAttributeBound` / `maxAttributeId` 已移除。
- 损伤/污染通过 Tag 表达；骨折通过 `Formula.select` 影响体力上限，感染/梦魇污染通过 Tag auto 影响属性。
- `CardTemplate.reactions` 是卡牌监听定义 id 数组；定义放在 `allCardReactions`，数组顺序即优先级，第一版只执行一轮。
- `CardReactionDefinition` 是可复用的卡牌监听定义；`trigger` 支持 `attributeChanged` / `tagAdded` / `tagRemoved`，条件可用 `attributeChanges` 数组同时读取多个属性的旧值、新值和存在性；数组内按 AND 判断，反应在一次变化批次中执行一次。
- `startDialogue` effect 启动对话；玩家 incoming 默认使用 targetCard，NPC outgoing 可用 slot。
- 对话状态保存 sourceCardId / targetCardId / slotMap。
- 详细触发方式见项目状态与配置案例。

## 共识

- `AgreementDefinition` 第一版只有 `kind: "promise"`。
- 当前定义不包含 parties / terms / 时间限制。
- `FamineState.agreements` 是全局权威 map。
- `CardState.agreementIds` 是参与卡上的索引。
- `createAgreement` 从动作 source/target 创建双方已知、已接受的承诺。
- `AgreementDefinition.promiseWaitTime` 是承诺分钟时长，创建时用发起卡属性求值；运行时写入 `promiseCreatedAt` / `promiseDeadline`。
- `AgreementDefinition.positions` 定义承诺位置；`AgreementState.positions` 保存 position → cardIds。
- `createAgreement.positions` 使用 `Record<string, TargetRef[]>`，同一位置可分配多张卡。
- `AgreementCheck.hasPosition(s)` 判断卡牌在承诺中的位置；`includesTargets` 定位具体实例。
- `confirmPromise` 由双方对话确认后写入 `promiseResolution`；时间到达不会自动失败。
- Condition 使用 `agreement: AgreementCheck` 判定共识。
- `AgreementCheck.includesTargets` 限定共识实例必须包含的参与者；`promiseConfirmation` / `promiseTime` / `promiseResult` 分别判定承诺确认、时间和结果。
- `DialogueCheck.includesTargets` 先过滤共同经历，再判断 triggered / count。
- `DialogueCheck` 支持 `experiencedNodeId(s)`、`chosenOptionId(s)`、`endedAtNodeId`；数组语义为全部满足。
- 对话历史记录 `visitedNodeIds`、`chosenOptionIds`、`endedAtNodeId`。
- 数值比较的 `gt/gte/lt/lte/eq` 抽离为 `BaseNumberCheck`，供 AttributeCheck / DialogueCountCheck 复用。
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

## demo 场景

- 每个场景是一份独立 JSON，放在 `public/scenes/`。
- `public/scenes/index.json` 提供场景列表和默认场景。
- 场景之间不共享配置，可以独立使用 ID 和作用域。
- 页面顶部场景选择器切换场景时会重置 demo。
