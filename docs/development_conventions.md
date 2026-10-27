# 开发约定

这份文档只记录**工程规范**：为什么这样分层、为什么这样命名、边界在哪里。
判断标准：一条规则换到另一个专项业务仍然成立，才写在这里；只对某个业务成立的契约和流程，留在该业务的代码与注释里。
代码本身能表达清楚的不重复；缩进、引号这类格式问题交给编辑器 / Prettier。

约定变更时先讨论，确认后在同一次改动里更新本文档，避免文档和代码各说各话。
本文档只写工程规范；项目进度、决策记录和当前技术债见 [项目现状与进度](./project_status.md)。

## 目录与依赖方向

```
src/
├── pages/                                 路由页面；只有 index.tsx 会注册成路由
│   ├── index.tsx
│   └── card_story_game/                   专项业务：页面 + 专项业务模块
│       ├── card_story_game_types.ts       专项业务类型
│       ├── validate/                      结构校验 / 归一化 / 语义校验
│       │   ├── index.ts                   公开 API
│       │   ├── validate_types.ts          校验结果类型
│       │   ├── common.ts                  共享解析工具
│       │   ├── tags.ts                    标签结构 / 归一化 / 语义校验
│       │   ├── actions.ts                 动作与参数解析
│       │   ├── templates.ts               模板、引用、字段初始值
│       │   └── config.ts                  根配置解析 / 归一化
│       └── editor/
│           ├── index.tsx                  路由入口
│           ├── editor.module.scss         页面骨架样式
│           ├── editor_theme.ts            编辑器 antd 主题
│           ├── hooks/                     编辑器专用 hooks（use_tag_editor / use_action_editor）
│           └── components/                页面专用组件（editor_top_bar / editor_tree / edit_panel）
├── services/                              只做 IO（fetch），不定义类型、不弹 UI
├── components/                            跨页面通用 UI（目前只有 file_import）
└── utils/                                 与业务无关的工具（文件下载、类型判断、基类）
```

依赖方向是单向的：

- 专项业务模块（types / validate）不依赖 services、不依赖 React；
- services 依赖专项业务模块，页面同时依赖两者；
- `utils` 不得 import `pages` 或 `services`；
- `components` 里的通用组件不得 import `card_story_game` 的专项业务逻辑。

专项业务的实现细节优先留在代码和注释里；确实需要跨文件说明时，再放到业务目录下的文档，不要混进本文档。

## 命名

- 文件、目录用 snake_case；React 组件名用 PascalCase。
- 专项业务的根层文件带域名前缀：`card_story_game_types.ts`；页面内子文件夹用短角色名：`editor/`、`validate/`，内部文件不再重复域名前缀。文件名是全局搜索时的第一锚点；子文件夹里的通用文件名（如 `types.ts`）如果容易冲突，可用角色前缀（如 `validate_types.ts`）区分。
- 组件一个文件夹，内含同名 `.tsx` 和 `.module.scss`：`editor_top_bar/editor_top_bar.tsx`；复合组件内部的私有子组件可以平铺在父目录并共用父级样式（如 `editor_tree/tag_tree.tsx`），其中通用的、无业务数据的子组件放到 `components/` 子目录（如 `editor_tree/components/tree_item.tsx`）。
- 只有路由入口叫 `index.tsx`；领域模块可以用 `index.ts` 作为唯一公开出口（如 `validate/index.ts`），组件目录不要加 `index.ts` 重导出。
- 样式类名用 camelCase（`treeItemActive`），与 TS 变量一致。
- 组件的 props 类型统一叫 `<组件名>Props`（如 `TagFormProps`），不要用泛化的 `Props`；全局搜索时能直接定位。
- 事件处理函数优先在组件内定义成具名函数，再传给 JSX；避免在 JSX 里写多行内联回调。简单的一次性闭包（如列表项 `onSelect={() => select(id)}`）可以保留。
- 不要有冗余的 JSX 标签：能直接作为父节点的子元素时，不要再包一层无意义的 `<div>`；只有需要布局、样式或事件边界时才加容器。

## 类型与复用

- 能从既有类型派生的不重复声明字段：可编辑字段用 `Pick`，排除内部字段用 `Omit`，可选覆盖用 `Partial`；表单值类型留在组件内，不放进业务 types。
- 通用类型判断优先用 `src/utils/type_guard.ts` 里的 `isString` / `isPlainObject` / `isPositiveInteger`，不要在业务代码里复制同义判断。

## 数据与状态

- 单页状态放在页面组件内，跨页面共享之前不引入状态库；
- 派生数据用 `useMemo` 计算，不另存一份 state；
- **新值依赖旧值时用函数式更新**（toggle、追加、删除、条件替换）。理由是闭包里的 state 是渲染快照，同一事件里连续更新会丢；直接传值则更直观，适合事件参数、接口数据、常量这类与旧值无关的场景；
- 不要在 updater 里做提示、请求、改 ref 等副作用，开发模式下 updater 可能被调用两次；
- 用户操作触发的状态设置在事件处理函数里直接完成，不要用 `useEffect` 监听状态后再设置另一个状态；effect 只用于和外部系统同步（请求、订阅、DOM 等），否则会多一轮渲染，数据流也更绕；
- 需要由父组件主动设置表单或子组件的内部值时，用 `useImperativeHandle` 暴露方法，在触发事件里调用，而不是用 effect 回填；
- 普通键值查找默认用对象 `{}`，不要默认上 `Map`；只有键不是字符串 / 数字、需要稳定插入顺序、频繁增删或需要 `.size` 时才用 `Map`；
- 但裸 `{}` 不是空的：它继承 `Object.prototype`。用户输入的 key 如果叫 `toString` / `constructor`，会读到原型上的值；如果叫 `__proto__`，赋值会触发 setter 而不是创建自有属性，计数和查找会静默出错。所以键来自用户输入（如标签 key）时，用 `Object.create(null)` 或 `Map`，不要用裸 `{}`。

## 校验

- 校验集中放在专项业务模块的 validate 文件中，services 与导入共用，不在调用点重复判断。
- 区分结构校验与语义校验：结构问题阻断加载 / 导入，语义问题只提示，避免半成品数据卡住流程。
- 问题统一用 `{ path, message }` 表达，`path` 定位到具体字段，便于列表展示与跳转。

## 组件与样式

- 组件保持受控：数据从 props 进，修改通过回调出，不在组件内复制一份 props 当 state。
- 表单类组件允许 antd Form 持有输入态；业务模型仍放在页面状态，通过变更回调同步。业务校验仍归 validate 模块，表单只负责展示错误。
- 事件处理函数用 `useCallback`，依赖尽量收敛；列表渲染里的逐项参数暂时允许内联箭头函数。
- 逻辑层统一用 `for` 循环（校验要收集全部问题、需要提前退出，也避免每次调用新建回调）；渲染列表保留 `map`，因为 JSX 需要数组。
- 组件样式一律 SCSS Module，与组件同目录；全局 reset 和公共样式放在 `src/css`。
- 父容器内的子元素用 `& > .child` 嵌套，明确层级。
- 优先 className，不用 inline style；涉及到动态 js 变量的话，可以例外。
- 全局 reset 只覆盖 `div`、`pre`、`input` 等标签，`section`、`header` 不在名单里。用这些标签做容器时要显式写 `box-sizing: border-box`，否则宽高会溢出。
- antd 组件的颜色、圆角、字号由该页面 / 业务自己的 theme 文件统一（如 `editor/editor_theme.ts`）；只有 antd 没暴露 token 的结构性细节（如 Splitter 分割线）才允许用 `:global` 覆盖。
- antd 的 `message` / `modal` 用 `App.useApp()` 获取，不用静态方法，否则拿不到主题上下文。

## IO 与反馈

- `services` 只负责请求与响应解析，不定义类型、不做提示。
- `file_import` 只负责“选择文件并读出文本”，不解析 JSON、不校验业务格式。
- JSON 解析、结构校验、归一化属于专项业务模块，不放在 services 或通用组件里。
- 阻断性错误用 `Modal`（导入失败、格式错误）；轻量反馈用 `message`（加载失败、导入成功）。

## 路由

- 路由只认 `pages/**/index.tsx`，其余 `.tsx` 视为普通组件，避免页面内的子组件被注册成野路由。
- 用 `HashRouter`：纯静态部署（如 GitHub Pages）不需要服务端 rewrite。
- 构建到子路径时用 `VITE_BASE=/xxx/ npm run build`，运行时资源路径统一走 `import.meta.env.BASE_URL`，不要硬编码 `/`。
