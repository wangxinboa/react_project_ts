# react_project_ts

基于 Vite + React + TypeScript 的卡牌叙事游戏与配置编辑器。个人项目，持续演进中。

游戏操作参考《密教模拟器》，目标是“现实过程 + 玄幻改写”的沙盒叙事；当前阶段先做配置编辑器，游戏本体尚未开始。

## 技术栈

- React 19 + TypeScript
- Vite 8
- antd 6（Splitter、Modal、message 等）
- SCSS Modules
- react-router-dom 7（HashRouter）

## 快速开始

```bash
npm install
npm run dev
```

- 编辑器：<http://localhost:5173/#/card_story_game/editor>

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
src/
├── pages/                  路由页面（只有 index.tsx 注册成路由）
├── services/               接口请求
├── components/             通用组件
├── utils/                  通用工具
└── css/                    全局样式
public/
└── card_story_game_default_config.json   默认配置
docs/
├── development_conventions.md            工程规范
└── project_status.md                     项目现状与进度
```

## 文档

- [工程约定](docs/development_conventions.md)：目录分层、命名、状态、校验、样式和 IO 边界
- [项目现状与进度](docs/project_status.md)：已完成、待做、决策记录和技术债
- [游戏设计笔记](src/pages/card_story_game/card_story_game.md)：玩法与机制的设计草稿

## 当前进度

编辑器已完成标签层（增删改、导入导出、标签级校验）；规则 / 模板编辑、右侧预览和游戏本体待做。
详见 [项目现状与进度](docs/project_status.md)。
