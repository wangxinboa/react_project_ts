# card_story_game 规范文档

- [规范总览](./schema_overview.md)：属性、条件、公式、效果、动作执行的整体说明。
- [TargetRef 上下文说明](./target_ref_contexts.md)：Condition / Effect / Formula 中 target 的指向。
- [Action 执行规范](./action_execution.md)：Action 原子执行、条件判定时机、effect 顺序、removeCard。

类型定义以 `card_story_game_types/` 下的 `.ts` 文件为准；规范说明与类型不匹配时，以代码和类型为最终依据，并同步文档。
