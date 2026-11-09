# Action 执行规范

Action 是原子操作。

## 执行阶段

```text
1. 解析动作槽位与目标卡
2. 使用动作开始前的状态快照，统一判定所有 effect 条件
3. 使用同一份快照，判定 changeAttributes.changes 内的条件
4. 生成执行计划
5. 按 effects 数组顺序执行已选中的效果
6. 最后统一处理 removeCard
```

## 条件判定时机

以下条件全部使用 action 开始前的卡牌状态：

- `effect.condition`
- `changeAttributes.changes[].condition`

后续 effect 不能看到前面 effect 修改后的属性值。

```json
[
  {
    "kind": "changeAttributes",
    "changes": [{ "attributeId": 1, "delta": -10 }]
  },
  {
    "kind": "changeAttributes",
    "condition": {
      "target": { "card": "sourceCard" },
      "attributes": [{ "id": 1, "lt": 40 }]
    },
    "changes": [{ "attributeId": 5, "delta": -2 }]
  }
]
```

第二个 effect 的条件读取的是动作开始前的饱食，不是第一个 effect 修改后的饱食。

## 执行顺序

条件全部判定完成后，仍按 `effects` 数组顺序执行：

```text
effect A 执行
effect B 执行
effect C 执行
```

“原子”指条件判定基于同一份初始快照，不表示效果同时发生。

## removeCard

`removeCard` 延迟到所有 effect 执行完成后统一删除。

## 不支持

同一个 action 内不支持：

```text
先修改属性
→ 后续 effect 根据修改后的属性决定是否执行
```

需要这种链式反应时，应拆成独立 action，或以后单独设计属性变化反应系统。

## Tag auto

Tag auto 不属于 Action，执行时机另行定义。
