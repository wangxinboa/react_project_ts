# react_project_ts

基于 Vite + React + TypeScript 的卡牌叙事游戏与配置编辑器。个人项目，持续演进中。

游戏操作参考《密教模拟器》，目标是“现实过程 + 玄幻改写”的沙盒叙事。

当前阶段是 **JSON 规范验证**：用最小可运行的饥荒流民原型，验证配置规范能否表达地点、动作、条件、效果、背包、NPC 行为等玩法。原型不是最终游戏版本。

## 技术栈

- React 19 + TypeScript
- Vite 8
- antd 6
- SCSS Modules
- react-router-dom 7（HashRouter）

## 快速开始

```bash
npm install
npm run dev
```

- 编辑器：<http://localhost:5173/#/card_story_game/editor>
- 饥荒流民原型：<http://localhost:5173/#/card_story_game/game/famine_refugee>

构建与检查：

```bash
npm run build    # tsc -b && vite build
npm run lint     # eslint
```

部署到子路径（如 GitHub Pages）时：

```bash
VITE_BASE=/react_project_ts/ npm run build
```

## 目录

```
src/pages/card_story_game/
├── card_story_game_types/       配置规范类型
│   └── effect_types/            按类别拆分的效果类型
├── game/famine_refugee/         饥荒流民原型
└── editor/                      配置编辑器

public/
├── card_story_game_default_config.json   编辑器默认配置
└── famine_refugee_config.json            原型配置
```

## 文档

- [工程约定](docs/development_conventions.md)：目录分层、命名、状态、校验、样式和 IO 边界
- [项目现状与进度](docs/project_status.md)：当前定位、已完成、待做和技术债
- [JSON 规范文档](src/pages/card_story_game/card_story_game_types/docs/card_story_game_types.md)：属性、条件、公式、效果、动作执行规范
- [游戏设计笔记](src/pages/card_story_game/card_story_game.md)：玩法与机制的设计草稿

## 当前进度

- 配置驱动原型已跑通：地点、进入卡、incoming、命名卡槽、公式、标签、背包、负重、NPC 自主行动；
- 规范类型已拆分出 `effect_types/`，Effect / Condition / TargetRef 有统一解析与分发；
- 编辑器仍是旧页面骨架，动作表单还保留 `targets` 过渡字段，模板表单和新 schema 尚未完全接入；
- 正式游戏、存档、完整 Editor 和正式属性面板仍未开始。

详见 [项目现状与进度](docs/project_status.md)。
