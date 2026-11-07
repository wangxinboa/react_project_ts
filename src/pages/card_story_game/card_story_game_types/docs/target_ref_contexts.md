# TargetRef 上下文说明

本文说明 `TargetRef` 在 Condition、EffectCall、FormulaNode 等环境中的指向。

## 1. TargetRef 结构

```ts
export interface TargetRef {
	card: ConditionTarget;
	/** card 为 slot 时指定卡槽 id */
	slot?: string;
}
```

`ConditionTarget` 的取值：

```ts
"sourceCard"
"sourceTag"
"targetCard"
"host"
"slot"
"referencedCard"
```

`TargetRef` 只回答“判断/作用哪张卡”。属性的具体判断放在 `AttributeCheck`：

```ts
{ id: 3, gt: 0 }                 // number 属性
{ refId: 21, refExists: false }  // cardRef 属性
{ refListId: 22, refListsMatch: { count: 0 } } // cardRefList 属性
```

`refId` / `refListId` 属于 `AttributeCheck`，不属于 `TargetRef`。

---

## 2. Condition

Condition 可以出现在：

- `RuleAction.conditions`
- `ActionSlot.conditions`
- `InlineEffect.conditions`
- `Formula.conditions`
- Tag 规则 / Tag auto 的条件

Condition 本身没有默认 target，必须显式写 `target`。

```json
{
  "target": { "card": "sourceCard" },
  "attributes": [{ "id": 3, "gt": 0 }]
}
```

### 2.1 outgoing 动作的条件

一对多动作，由 sourceCard 发起，多个目标进入命名卡槽。

```text
sourceCard = 发起动作的卡牌（玩家 / NPC）
slot       = 当前卡槽中的候选卡
targetCard = 无
sourceTag  = 无
host       = 无
```

```json
{
  "target": { "card": "slot", "slot": "food" },
  "isCardType": "item"
}
```

### 2.2 incoming 动作的条件

一对一动作，sourceCard 执行，targetCard 是被响应的卡。

```text
sourceCard = 执行者
targetCard = 当前选中的响应目标
slot       = 可选，动作额外卡槽中的卡
```

```json
{
  "target": { "card": "targetCard" },
  "attributes": [
    { "refId": 21, "refExists": true }
  ]
}
```

incoming 的 slots 主要作为附加条件，不改变 targetCard 的一对一语义。

### 2.3 卡槽条件

`ActionSlot.conditions` 中：

```text
sourceCard = 动作发起者
slot       = 当前放入该卡槽的候选卡
```

```json
{
  "target": { "card": "slot", "slot": "food" },
  "hasTag": 8
}
```

`slot` 必须和 `target.slot` 中的卡槽 id 一致。

---

## 3. EffectCall

`EffectCall` 的 `target` 也是 `TargetRef`。

```ts
export type EffectTarget = TargetRef;

export type InlineEffect = EffectKind & {
	id: number;
	target?: EffectTarget;
	conditions?: Condition[];
};
```

### 3.1 默认 target

- RuleAction 的 effect 省略 target：默认 `sourceCard`；
- Tag auto 的 effect 省略 target：默认 `sourceTag`。

### 3.2 outgoing / incoming 中的 effect

```text
sourceCard = 动作执行者
slot       = 对应卡槽中的卡
targetCard = incoming 的响应目标（仅 incoming）
```

例如 outgoing 动作把卡槽中的食物作为效果目标：

```json
{
  "id": 100,
  "kind": "changeAttributes",
  "target": { "card": "slot", "slot": "food" },
  "changes": [{ "attributeId": 8, "delta": -10 }]
}
```

incoming 动作修改当前目标：

```json
{
  "id": 101,
  "kind": "changeAttributes",
  "target": { "card": "targetCard" },
  "changes": [{ "attributeId": 1, "delta": 10 }]
}
```

### 3.3 effect.conditions 的上下文

effect 的 `conditions` 与 effect 使用同一套环境：

```text
sourceCard = 动作执行者
targetCard = incoming 目标（如果存在）
slot       = effect 条件中指定的卡槽
host/sourceTag = Tag auto 环境
```

effect target 和 effect condition target 是两件事：

- `target` 决定效果作用谁；
- `conditions[].target` 决定条件判断谁。

---

## 4. FormulaNode

FormulaNode 自身没有 `TargetRef` 字段。静态数字直接用 number；只有动态计算才使用 FormulaNode。

```ts
export type FormulaNode =
	| { op: "literal"; value: number }
	| { op: "numberAttributeValue"; attributeId: number }
	| { op: "numberAttributeBound"; attributeId: number; boundary: "min" | "max" }
	| { op: "floor" | "abs"; value: Formula }
	| { op: "refListsAttributeSum"; refAttributeId: number; valueAttributeId: number }
	| { op: "refListsAttributeCount"; refAttributeId: number }
	| ...;
```

### 4.1 numberAttributeValue

默认读取 sourceCard 的数字属性。

```json
{ "op": "numberAttributeValue", "attributeId": 3 }
```

静态数字直接写：

```json
100
```

带条件的常量使用 `literal`：

```json
{ "op": "literal", "value": -15, "conditions": [...] }
```

### 4.2 refListsAttributeSum / refListsAttributeCount

默认读取 sourceCard 的 cardRefList 属性：

```json
{
  "op": "refListsAttributeSum",
  "refAttributeId": 22,
  "valueAttributeId": 13
}
```

```json
{
  "op": "refListsAttributeCount",
  "refAttributeId": 22
}
```

公式不会自动进入引用卡环境。需要判断引用卡自身属性时，使用 Condition 的 `refListsMatch`。

### 4.3 Formula 的 conditions

Formula 节点的 conditions 使用与所在环境相同的 Condition 上下文：

```json
{
  "op": "numberAttributeValue",
  "attributeId": 15,
  "conditions": [
    {
      "target": { "card": "sourceCard" },
      "attributes": [{ "id": 3, "gt": 0 }]
    }
  ]
}
```

公式条件不满足时，该节点按 0 计算。

---

## 5. referencedCard

`referencedCard` 只在 `AttributeCheck.refListsMatch.match` 内有效。

```json
{
  "target": { "card": "sourceCard" },
  "attributes": [
    {
      "refListId": 22,
      "refListsMatch": {
        "match": [
          {
            "target": { "card": "referencedCard" },
            "hasTag": 12
          }
        ],
        "count": 0
      }
    }
  ]
}
```

此时：

```text
sourceCard     = 动作发起者 / 当前条件卡
referencedCard = backpack 列表中当前遍历到的卡
```

`match` 条件里的 `target` 通常写 `referencedCard`；不要写 `sourceCard`，否则判断的是外层卡，而不是列表中的卡。

---

## 6. sourceTag / host

只用于 Tag 规则 / Tag auto：

```text
sourceTag = 当前标签实例
host      = 标签附着的宿主卡
```

```json
{
  "target": { "card": "host" },
  "attributes": [{ "id": 1, "lte": 20 }]
}
```

Tag 环境没有普通动作的 `sourceCard` / `slot` / `targetCard`。

---

## 7. 环境对照表

| 环境 | sourceCard | sourceTag | targetCard | host | slot | referencedCard |
|---|---|---|---|---|---|---|
| outgoing 动作条件 | 发起者 | 无 | 无 | 无 | 卡槽候选卡 | 仅 refListsMatch |
| incoming 动作条件 | 执行者 | 无 | 响应目标 | 无 | 额外卡槽 | 仅 refListsMatch |
| 卡槽条件 | 发起者 | 无 | incoming 时可有 | 无 | 当前候选卡 | 仅 refListsMatch |
| 动作 effect target | 发起者 | 无 | incoming 目标 | 无 | 卡槽卡 | 无 |
| 动作 effect conditions | 发起者 | 无 | incoming 目标 | 无 | 条件卡槽 | 仅 refListsMatch |
| Formula attr / ref 操作 | 默认读取 sourceCard | 无 | 无 | 无 | 无 | 无 |
| Formula conditions | 同所在环境 | 无 | 同所在环境 | 无 | 同所在环境 | 仅 refListsMatch |
| Tag 条件 / auto | 无 | 标签实例 | 无 | 宿主卡 | 无 | 仅 refListsMatch |

---

## 8. 速记

```text
sourceCard = 谁发起 / 谁执行
targetCard = incoming 响应谁
slot       = 哪个卡槽里的卡
sourceTag  = 哪个标签实例
host       = 标签贴在谁身上
referencedCard = cardRefList 当前遍历到谁
```

`TargetRef` 只负责选卡；number / cardRef / cardRefList 的属性判断由 `AttributeCheck` 完成。
