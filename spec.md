# 项目规范（spec.md）

> 项目：开源 AI 工程 Monorepo（前后端同仓）
> 布局参考：LobeChat Monorepo；分离原则参考：MNN frontend-backend separation
> 本文档是代码生成的唯一依据：任何实现与本规范冲突，一律视为缺陷，以本规范为准。

## 0. 范围

- 本 spec 约束脚手架及后续迭代的目录结构、契约规则、依赖方向、后端分层与保护文件清单。
- 目录树以已确认的版本为准（`apps/web`、`apps/server`、`packages/shared-types`、`packages/shared-utils`），本文不重复展开。

## 1. Workspace 职责边界

每个 workspace 用一句话限定职责，超出即越界：

| Workspace | 职责边界（一句话） |
| --- | --- |
| `apps/web` | 基于 React + TS + Vite 的前端应用：只负责 UI 与客户端状态，只能通过 HTTP API（统一经 `src/services/` 或页面级 hook）与后端交互。 |
| `apps/server` | 基于 Express + TS 的后端 API 服务：唯一 HTTP 入口，承载 AI 能力集成（`src/ai/`）与业务编排，不感知前端存在。 |
| `packages/shared-types` | 前后端契约层：集中定义全部 API 请求/响应 DTO、领域模型类型、共享枚举；零运行时依赖、零构建、源码直出。 |
| `packages/shared-utils` | 跨端共享纯函数工具库：零框架依赖，前后端共同调用，不含任何 I/O 与副作用。 |

## 2. 共享类型使用规则（契约层）

| 编号 | 规则 |
| --- | --- |
| R2.1 | 任何跨端传输的数据结构（API 请求/响应体、错误码、分页结构、SSE/WebSocket 消息）必须定义在 `packages/shared-types`，并按 `src/api/`、`src/models/`、`src/enums/` 归位。 |
| R2.2 | `apps/web` 与 `apps/server` 内部禁止重复定义 R2.1 所列类型，只能从 `@repo/shared-types` import。 |
| R2.3 | apps 内部允许定义"仅自身使用"的视图类型（如组件 Props、hook 返回结构），但必须由契约类型派生（`extends` / 引用），不得平行重写同名字段。 |
| R2.4 | 接口变更顺序固定：先改 `shared-types` → 两端 typecheck 同时报错 → 再分别修复实现。禁止"先改实现、后补类型"。 |
| R2.5 | `shared-types` 禁止一切运行时依赖与可执行逻辑：只允许 `type` / `interface` / `enum` / 纯字面量常量；其 `package.json` 的 `dependencies` 与 `devDependencies` 必须为空。 |

## 3. 依赖方向约束

### 3.1 允许的依赖

- `apps/* → packages/*`（单向向下）
- `packages/* → packages/*`（包间可互相依赖；但 shared-types 的零运行时依赖规则优先——它对其他包也只能做 type-only 引用）

### 3.2 禁止的依赖

| 编号 | 禁止边 | 说明 |
| --- | --- | --- |
| R3.1 | `apps/web → apps/server` | 前后端仅通过 HTTP API 通信 |
| R3.2 | `apps/server → apps/web` | 后端不感知前端 |
| R3.3 | `packages/* → apps/*` | 共享层不得反向依赖应用 |
| R3.4 | `shared-types → 任何运行时依赖` | 契约层保持纯类型 |

### 3.3 执行机制（不靠自觉）

- 包间依赖只允许以 `"@repo/xxx": "workspace:*"` 形式在 `package.json` 声明。
- `eslint.config.mjs` 使用 eslint-plugin-boundaries 固化 3.1 / 3.2：按 element-types（apps / packages）白名单化，未显式允许的 import 一律报错（lint 体系接入后生效）。
- CI 中 `pnpm lint` 与 `pnpm typecheck` 全绿是合并前置条件。

## 4. 后端分层约束（apps/server）

调用链唯一且单向：`routes → controller → service → repository`；`ai/` 属于 service 层的实现细节，只能被 service 调用。业务按垂直模块组织在 `src/modules/<name>/` 下（routes / controller / service / types 同居一模块目录）。

| 层 | 文件/目录 | 允许 | 禁止 |
| --- | --- | --- | --- |
| 路由层 | `*.routes.ts` | 声明 HTTP 方法/路径到 controller 的映射；挂载中间件 | 出现业务逻辑；直接调用 service / repository |
| 控制器层 | `*.controller.ts` | 解析请求（含校验）、调用 service、组装响应 DTO 与状态码 | 业务逻辑；直接访问 repository / db；产生 I/O |
| 服务层 | `*.service.ts` | 承载全部业务逻辑与数据操作；可调用其他 service | 直接操作 `req` / `res`（不得 import Express 请求/响应类型）、处理状态码 |
| AI 层 | `src/ai/` | LLM provider 适配、agent 编排、RAG pipeline | 被 routes / controller 直接调用（必须经 service） |
| 中间件 | `src/middlewares/` | 横切关注点：auth、错误处理、日志 | 业务逻辑；跨层调用 |
| 应用入口 | `src/server.ts` | 组装中间件、挂载路由、启动监听（组合根） | 业务逻辑 |

- R4.1 禁止跨层调用：任何一层只能调用其直接下一层（routes → controller → service）。
- R4.2 controller 层禁止横向互调；需要复用逻辑时下沉到 service（service 之间允许编排式互调）。
- R4.3 controller 组装的响应体类型必须来自 `@repo/shared-types`（与 R2.1 衔接）。

## 5. AI 禁改文件清单（Protected Files）

脚手架生成完成后，以下文件为受保护文件，未经用户在会话中显式批准，AI 不得创建、修改或删除：

| 文件 | 保护理由 |
| --- | --- |
| `pnpm-workspace.yaml` | workspace 边界定义，改动即改变仓库拓扑 |
| `package.json`（根） | 全仓脚本与工具链版本基线 |
| `pnpm-lock.yaml` | 只能由 `pnpm install/update` 自动生成，禁止手改 |
| `tsconfig.json`（根，base 配置） | 全仓编译基线（strict 等全局开关） |
| `eslint.config.mjs` | 依赖方向约束（boundaries 规则）的实现载体，改它等于改架构规则 |
| `.github/workflows/*` | CI 卡点，改动可能绕过 lint / typecheck 门禁 |
| `.nvmrc` / `.prettierrc` | 环境与格式基线 |

- R5.1 涉及以上文件的必要变更，必须先向用户说明动机与影响范围，获批准后方可执行。
- R5.2 新增 workspace（apps / packages 下新增包）视同高危操作：需同步评审 `pnpm-workspace.yaml`、`eslint.config.mjs` 等影响面。

## 6. 里程碑验收清单（Definition of Done）

- [x] `pnpm install` 一次通过，workspace 解析正常
- [x] `pnpm dev` 同时启动 web（Vite）与 server（tsx watch）
- [x] `pnpm typecheck` 全绿
- [x] 反向验证：`apps/web` 与 `apps/server` 之间无任何 import（boundaries lint 接入后由规则强制）
- [x] `packages/shared-types/package.json` 中 dependencies 与 devDependencies 均为空
- [x] server 的 `/api/users` CRUD 走通 `routes → controller → service`，响应类型来自 `@repo/shared-types`
- [x] web 用户列表页经 Vite 代理展示数据
