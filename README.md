# ai-monorepo

开源工程 Monorepo 骨架：**前后端同仓，但架构边界由工具链强制**（不是靠 code review 时的自觉）。

当前状态：可运行的最小闭环 —— 一个垂直切片（用户 CRUD）跑在完整的分层 + 契约 + 门禁体系上。因此这里能跑的东西很少，但**边界规则是真的会被 CI 拦下来的**。

---

## 1. 项目解决什么问题

前后端同仓的 Monorepo 最常见的退化方式是：目录分开了，但代码里 `apps/web` 直接 import `apps/server`，两端各写一份相同接口类型，controller 里顺手查数据库，最后"分层"只剩目录名。

本项目把这些问题从"约定"变成"机器可校验的规则"：

| 问题 | 本项目的强制手段 |
| --- | --- |
| 前端直接引用后端代码，绕过 HTTP 契约 | ESLint `eslint-plugin-boundaries` + dependency-cruiser 双重拦截 |
| 两端各写一份 API 类型，改一边忘另一边 | 契约集中在 `packages/shared-types`，两端只能 import |
| 契约被悄悄放宽成 `any` | `@typescript-eslint/no-explicit-any` 为 error 级（全仓生效），且契约层 `dependencies` 为空 |
| 后端分层形同虚设（controller 直接查库） | `routes → controller → service` 单向调用，无跨层快捷路径 |
| 类型检查因 JSX/DOM 配置分家而失效 | TypeScript **Project References**（`tsc -b`）统一收口全仓 |
| 门禁跑不起来 / 测试空转 | 每个 workspace 都有真实可执行的 `lint / typecheck / test` |

---

## 2. 主要功能

| 能力 | 位置 | 说明 |
| --- | --- | --- |
| 契约层（单一类型来源） | [packages/shared-types](packages/shared-types) | `User` / `CreateUserRequest` / `UpdateUserRequest` / `UserListResponse`，零运行时依赖、源码直出 |
| 依赖方向门禁 | [eslint.config.mjs](eslint.config.mjs) | `web-app` / `server-app` 只能依赖 `shared-types`（及预留的 `shared-utils`）；`shared-types` 不允许依赖任何包；未列出的依赖一律 `error` |
| 依赖图门禁 | [.dependency-cruiser.cjs](.dependency-cruiser.cjs) | 三条 error 级规则：禁止 web→server、server→web、shared-types 引入包外模块 |
| 全仓类型检查 | [tsconfig.json](tsconfig.json) | `files: []` + `references` → `tsc -b` 按项目引用构建，各 app 用各自的 `jsx` / `lib` 配置 |
| 后端分层示例 | [apps/server/src/modules/user](apps/server/src/modules/user) | 垂直模块：`user.routes.ts` / `user.controller.ts` / `user.service.ts` / `user.types.ts` |
| 前端页面示例 | [apps/web/src/pages/UserList](apps/web/src/pages/UserList) | `useUsers` hook 拉取列表（含 loading / error / AbortController 清理），页面渲染表格 |
| 单元测试 | 各 workspace `src/sanity.test.ts` | 每包 1 个真实执行的 Vitest 用例（含 server 调用 service 的用例） |

### 已实现的 API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/users` | 返回全部用户（`items` + `total`，无分页参数） |
| `GET` | `/api/users/:id` | 按 id 查询，不存在返回 `404` |
| `POST` | `/api/users` | 创建用户，成功返回 `201` |
| `PATCH` | `/api/users/:id` | 局部更新，不存在返回 `404` |
| `DELETE` | `/api/users/:id` | 删除，成功返回 `204`，不存在返回 `404` |

数据存在**内存数组**中，进程重启即清空；id 形如 `usr_1`，`createdAt` 为 ISO 8601 字符串。目前**没有**数据库、鉴权、CORS 中间件与持久化（见 [§7 当前范围](#7-当前范围未实现的部分)）。

---

## 3. 安装方法

**前置要求**

- Node.js >= 20（`package.json` 的 `engines` 声明）
- pnpm >= 9（仓库锁定 `packageManager: pnpm@9.15.0`）

```bash
# 若尚无 pnpm
corepack enable pnpm
# 或 npm i -g pnpm

# 安装依赖（根目录执行，一次装完所有 workspace）
pnpm install
```

**关于 `.npmrc`**：[.npmrc](.npmrc) 将依赖 store 固定为项目内的 `.pnpm-store/`（已在 `.gitignore` 中排除）。这样做的原因是：多项目共用全局 store 时会因并发写入出现 `ERR_PNPM_EPERM`，项目内 store 可完全隔离该冲突。首次 `pnpm install` 会重新下载依赖，之后复用本地 store。

无需配置任何环境变量即可启动；`PORT` 可选（见下）。

---

## 4. 使用方法

### 一次性启动前后端

```bash
pnpm dev
```

- 前端（Vite）：<http://localhost:5173>
- 后端（Express，tsx watch）：<http://localhost:3100>
- Vite 已配置 `/api` 代理到 `http://localhost:3100`（见 [apps/web/vite.config.ts](apps/web/vite.config.ts)），因此前端用相对路径 `/api/users` 即可命中后端，不涉及跨域。

### 单独启动某一端

```bash
pnpm --filter @repo/web dev       # 只启动前端
pnpm --filter @repo/server dev    # 只启动后端
```

### 修改后端端口

```bash
# bash / zsh
PORT=3200 pnpm --filter @repo/server dev

# Windows PowerShell
$env:PORT=3200; pnpm --filter @repo/server dev
```

注意：改端口后需同步修改 Vite 代理目标，否则 `/api` 仍指向 3100。

### 门禁命令（CI 可用的卡点）

| 命令 | 作用 | 说明 |
| --- | --- | --- |
| `pnpm lint` | ESLint（含 boundaries 依赖方向规则） | 3 个 workspace 全量检查 |
| `pnpm typecheck` | `tsc -b`（Project References 全图） | 覆盖 shared-types → server → web |
| `pnpm test` | `vitest run` | 每个 workspace 各 1 个用例，真实执行 |
| `pnpm check:deps` | `depcruise apps packages` | 依赖图层面校验三条边界规则 |
| `pnpm build` | `pnpm -r run build` | 目前**仅** `apps/web` 有 `build` 脚本，产物输出到 `apps/web/dist`；server 以 `tsx` 直接运行，无 build 脚本 |

### 页面行为

打开 <http://localhost:5173> 后看到用户列表表格，列为 `Avatar / ID / Email / Name / Created`：

- 加载中：显示 `Loading…`
- 请求失败：显示错误文案（`Request failed with status <code>` 等）
- 无数据：表格正文显示 `No users`
- `avatarUrl` 缺失时头像列显示 `—`

新建用户需通过下方 API 调用（页面当前只做读取展示，没有表单）。

---

## 5. 输入输出示例

以下示例的字段与 [packages/shared-types/src/user.ts](packages/shared-types/src/user.ts) 完全一致。

### 创建用户（POST /api/users）

```bash
curl -X POST http://localhost:3100/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"ada@example.com","name":"Ada"}'
```

请求体类型 `CreateUserRequest`：`{ email: string; name: string }`

响应 `201 Created`，类型 `User`：

```json
{
  "id": "usr_1",
  "email": "ada@example.com",
  "name": "Ada",
  "createdAt": "2026-10-21T14:30:04.709Z"
}
```

> `avatarUrl` 为可选字段，创建时不传则不出现。

### 查询列表（GET /api/users）

```bash
curl http://localhost:3100/api/users
```

响应 `200 OK`，类型 `UserListResponse`：

```json
{
  "items": [
    {
      "id": "usr_1",
      "email": "ada@example.com",
      "name": "Ada",
      "createdAt": "2026-10-21T14:30:04.709Z"
    }
  ],
  "total": 1
}
```

### 查询单个（GET /api/users/:id）

```bash
curl http://localhost:3100/api/users/usr_1
```

- 命中：`200` + 单个 `User` 对象（结构同上）
- 未命中：`404`（Express 默认状态文本 `Not Found`）

### 局部更新（PATCH /api/users/:id）

```bash
curl -X PATCH http://localhost:3100/api/users/usr_1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada Lovelace","avatarUrl":"https://example.com/a.png"}'
```

请求体类型 `UpdateUserRequest`：`{ name?: string; email?: string; avatarUrl?: string }`（只更新传入的字段）

响应 `200 OK`：

```json
{
  "id": "usr_1",
  "email": "ada@example.com",
  "name": "Ada Lovelace",
  "avatarUrl": "https://example.com/a.png",
  "createdAt": "2026-10-21T14:30:04.709Z"
}
```

### 删除（DELETE /api/users/:id）

```bash
curl -i -X DELETE http://localhost:3100/api/users/usr_1
```

- 成功：`204 No Content`，无响应体
- 未命中：`404`

### 前端侧输入输出

前端不产生请求体，输入就是上面这些接口的响应；输出是页面表格。例如 `GET /api/users` 返回的 `items` 会逐行渲染，`createdAt` 经 `new Date(...).toLocaleString()` 本地化后显示。

---

## 6. 目录结构与架构规则

```
apps/
  web/                React 19 + TypeScript + Vite（5173，/api 代理到 3100）
  server/             Express 5 + TypeScript（3100，tsx watch）
packages/
  shared-types/       契约层：API DTO / 领域类型（零运行时依赖，源码直出）
```

架构规则（可执行，非建议）：

- `apps/web` 与 `apps/server` **禁止**互相 import，只能通过 HTTP API 通信
- 所有 API 请求/响应类型**必须**定义在 `packages/shared-types`，apps 内只能 import
- 后端严格单向分层：`routes → controller → service`，禁止跨层调用
  - routes：只做方法/路径映射
  - controller：只解析 `req` → 调 service → 组装 `res` / 状态码
  - service：纯业务逻辑，不得出现 `req`/`res` 或 HTTP 状态码
- 共享逻辑一律下沉 `packages/`，禁止在 apps 之间复制

完整规范见 [spec.md](spec.md)。

---

## 7. 当前范围（未实现的部分）

为避免误解，以下内容**尚未实现**，仅在规范中预留：

- 数据库 / 持久化（当前为内存存储，重启即清空）
- 鉴权与用户会话
- CORS 中间件（跨域调用请走 Vite 代理）
- AI 能力集成（`apps/server/src/ai/` 尚未创建）
- `packages/shared-utils`（跨端工具包尚未创建；根 `tsconfig.json` 的 `paths` 中已预留别名）
- 前端写入表单（页面目前只做列表展示）
- 测试仅为各 workspace 1 个 sanity 用例，不代表业务覆盖率
