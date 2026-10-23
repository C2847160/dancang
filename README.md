# ai-monorepo

开源工程 Monorepo 骨架：**前后端同仓，但架构边界由工具链强制**（不是靠 code review 时的自觉）。

当前状态：可运行的最小闭环 —— 一个垂直切片（用户 CRUD）跑在完整的分层 + 契约 + 门禁体系上。因此这里能跑的东西很少，但**边界规则是真的会被 CI 拦下来的**。

---

## 1. 项目解决什么问题

前后端同仓的 Monorepo 最常见的退化方式是：目录分开了，但代码里 `apps/web` 直接 import `apps/server`，两端各写一份相同接口类型，controller 里顺手查数据库，最后"分层"只剩目录名。

本项目把这些问题从"约定"变成"机器可校验的规则"：

| 问题                                    | 本项目的强制手段                                                                           |
| --------------------------------------- | ------------------------------------------------------------------------------------------ |
| 前端直接引用后端代码，绕过 HTTP 契约    | ESLint `eslint-plugin-boundaries` + dependency-cruiser 双重拦截                            |
| 两端各写一份 API 类型，改一边忘另一边   | 契约集中在 `packages/shared-types`，两端只能 import                                        |
| 契约被悄悄放宽成 `any`                  | `@typescript-eslint/no-explicit-any` 为 error 级（全仓生效），且契约层 `dependencies` 为空 |
| 后端分层形同虚设（controller 直接查库） | `routes → controller → service` 单向调用，无跨层快捷路径                                   |
| 类型检查因 JSX/DOM 配置分家而失效       | TypeScript **Project References**（`tsc -b`）统一收口全仓                                  |
| 门禁跑不起来 / 测试空转                 | 每个 workspace 都有真实可执行的 `lint / typecheck / test`                                  |

---

## 2. 主要功能

| 能力                   | 位置                                                                                         | 说明                                                                                                                                                |
| ---------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 契约层（单一类型来源） | [packages/shared-types](packages/shared-types)                                               | `User` / `CreateUserRequest` / `UpdateUserRequest` / `UserListResponse` / `LoginRequest` / `LoginResponse` / `ApiErrorBody`，零运行时依赖、源码直出 |
| 请求体校验             | [apps/server/src/middlewares/validate.ts](apps/server/src/middlewares/validate.ts)           | zod schema 在进入 controller 前校验并归一化 `req.body`，失败统一转成 400 + 字段级 details                                                           |
| 全局错误处理           | [apps/server/src/middlewares/error-handler.ts](apps/server/src/middlewares/error-handler.ts) | 4 参 Express 错误中间件：`AppError` → 对应状态码，`ZodError` → 400，未知异常 → 500 且只回固定文案                                                   |
| 依赖方向门禁           | [eslint.config.mjs](eslint.config.mjs)                                                       | `web-app` / `server-app` 只能依赖 `shared-types`；`shared-types` 不允许依赖任何包；未列出的依赖一律 `error`                                         |
| 依赖图门禁             | [.dependency-cruiser.cjs](.dependency-cruiser.cjs)                                           | 三条 error 级规则：禁止 web→server、server→web、shared-types 引入包外模块                                                                           |
| 全仓类型检查           | [tsconfig.json](tsconfig.json)                                                               | `files: []` + `references` → `tsc -b` 按项目引用构建，各 app 用各自的 `jsx` / `lib` 配置                                                            |
| 后端分层示例           | [apps/server/src/modules](apps/server/src/modules)                                           | 垂直模块：`user`（routes / controller / service / schema）与 `auth`（login 校验链路）                                                               |
| 前端页面示例           | [apps/web/src/pages/UserList](apps/web/src/pages/UserList)                                   | `useUsers` hook 拉取列表（含 loading / error / AbortController 清理），页面渲染表格                                                                 |
| 测试                   | `apps/server/src/**/*.test.ts`                                                               | service 单测 9 例 + HTTP 集成测试 10 例（supertest 走真实中间件链，覆盖 201 / 400 / 401 / 404）                                                     |

### 已实现的 API

| 方法     | 路径              | 说明                                                              |
| -------- | ----------------- | ----------------------------------------------------------------- |
| `GET`    | `/api/users`      | 返回全部用户（`items` + `total`，无分页参数）                     |
| `GET`    | `/api/users/:id`  | 按 id 查询，不存在返回 `404` + JSON 错误体                        |
| `POST`   | `/api/users`      | 创建用户（需 `password`，服务端只存 scrypt 加盐哈希），返回 `201` |
| `PATCH`  | `/api/users/:id`  | 局部更新，不存在返回 `404`                                        |
| `DELETE` | `/api/users/:id`  | 删除，成功返回 `204`，不存在返回 `404`                            |
| `POST`   | `/api/auth/login` | 校验邮箱 + 密码，成功返回 `200 { user }`，失败返回 `401`          |

数据存在**内存数组**中，进程重启即清空；id 形如 `usr_1`，`createdAt` 为 ISO 8601 字符串。登录只做凭据校验，**不签发 token / 不建立会话**。目前**没有**数据库、CORS 中间件与持久化（见 [§7 当前范围](#7-当前范围未实现的部分)）。

### 统一错误格式

所有失败响应（含 404、校验失败、未捕获异常）都是同一结构，定义于 [packages/shared-types/src/error.ts](packages/shared-types/src/error.ts)：

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request body is invalid",
    "details": [{ "path": "password", "message": "Password must be at least 8 characters" }]
  }
}
```

`code` 取值：`VALIDATION_ERROR` / `UNAUTHORIZED` / `NOT_FOUND` / `CONFLICT` / `INTERNAL_ERROR`。`details` 只在字段级校验失败时出现。

---

## 3. 本地运行指南

### 3.1 前置要求

| 依赖    | 版本要求                       | 检查命令        |
| ------- | ------------------------------ | --------------- |
| Node.js | `>= 20`（推荐 24，与 CI 一致） | `node -v`       |
| pnpm    | `>= 9`（仓库锁定 `9.15.0`）    | `pnpm -v`       |
| Git     | 任意近期版本                   | `git --version` |

`package.json` 的 `engines` 只强制 `>= 20`；CI 与本地推荐环境均为 Node 24。Node 20 在 GitHub Actions 上已被标记为 deprecated，低于 20 的版本不受支持。

### 3.2 从零到跑通（四步）

```bash
# 1. 克隆仓库
git clone https://github.com/C2847160/dancang.git
cd dancang

# 2. 确认 Node 版本（不满足则先切版本）
node -v

# 3. 安装依赖（根目录执行一次，装完所有 workspace）
#    若尚无 pnpm：corepack enable pnpm  或  npm i -g pnpm
pnpm install

# 4. 同时启动前后端
pnpm dev
```

启动成功后：

- 前端：<http://localhost:5173>
- 后端：<http://localhost:3100>
- 浏览器打开前端地址应看到用户列表表格（内存中初始为空，显示 `No users`）

`pnpm install` 结束时会自动执行根 `prepare` 脚本安装 Git 钩子（husky），因此克隆后**无需额外步骤**即可获得提交前检查。如果你不想要钩子，可在命令前加 `HUSKY=0`。

### 3.3 关于 `.npmrc`

[.npmrc](.npmrc) 把依赖 store 固定为项目内的 `.pnpm-store/`（已在 `.gitignore` 中排除）。原因：多项目共用全局 store 时会因并发写入触发 `ERR_PNPM_EPERM`，项目内 store 可完全隔离该冲突。首次 `pnpm install` 会重新下载依赖，之后复用本地 store。

### 3.4 环境变量

服务端直接读取 `process.env`，**不加载 `.env` 文件**。变量清单与注入方式见 [.env.example](.env.example)；默认值即可直接启动，通常无需配置。

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

| 命令                | 作用                                 | 说明                                                                                                                      |
| ------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `pnpm lint`         | ESLint（含 boundaries 依赖方向规则） | 3 个 workspace 全量检查                                                                                                   |
| `pnpm typecheck`    | `tsc -b`（Project References 全图）  | 覆盖 shared-types → server → web                                                                                          |
| `pnpm test`         | `vitest run`                         | shared-types / web 各 1 例；server 19 例（service 单测 + supertest 集成测试）                                             |
| `pnpm check:deps`   | `depcruise apps packages`            | 依赖图层面校验三条边界规则                                                                                                |
| `pnpm format:check` | `prettier --check .`                 | 校验格式化，CI 会跑                                                                                                       |
| `pnpm format`       | `prettier --write .`                 | 本地批量修复格式化                                                                                                        |
| `pnpm build`        | `pnpm -r run build`                  | 目前**仅** `apps/web` 有 `build` 脚本，产物输出到 `apps/web/dist`；server 以 `tsx` 直接运行，无 build 脚本。CI 会跑这一步 |

### 三层门禁的执行时机

| 时机                | 钩子 / 平台         | 实际执行内容                                                            |
| ------------------- | ------------------- | ----------------------------------------------------------------------- |
| `git commit`        | `.husky/pre-commit` | `lint-staged`：暂存文件跑 `eslint --fix` + `prettier --write`           |
| `git push`          | `.husky/pre-push`   | `typecheck` + `test` + `check:deps`                                     |
| PR / push 到 `main` | GitHub Actions `CI` | `format:check` + `lint` + `typecheck` + `test` + `build` + `check:deps` |

提交前检查只覆盖被修改的文件（毫秒级），推送前与 CI 跑全量（秒级）。任何一层不通过都会中断流程。

### 常见问题排查

| 现象                                                    | 原因与处理                                                                                                                                               |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EADDRINUSE :3100`                                      | 端口被占用。`netstat -ano \| findstr :3100` 找到 PID，或在 PowerShell 用 `$env:PORT=3200; pnpm --filter @repo/server dev` 换端口（记得同步改 Vite 代理） |
| 前端页面请求 `/api/*` 返回 502 / 连接被拒绝             | 后端没起来，或端口与 [vite.config.ts](apps/web/vite.config.ts) 的代理目标不一致                                                                          |
| `ERR_PNPM_EPERM`                                        | 全局 store 被其他进程占用。确认 [.npmrc](.npmrc) 的 `store-dir=.pnpm-store` 生效，必要时删除 `.pnpm-store/` 重装                                         |
| `husky` 提示钩子未安装                                  | 手动执行 `pnpm exec husky init`，或重新 `pnpm install` 触发 `prepare`                                                                                    |
| PowerShell 执行 `pnpm install` 报 `PSSecurityException` | 执行策略阻止了 `.ps1`。改用 `pnpm.cmd install`，不要为此关闭执行策略                                                                                     |
| `tsx: not found`                                        | 依赖未安装完整，重新 `pnpm install`                                                                                                                      |

### 页面行为

打开 <http://localhost:5173> 后看到用户列表表格，列为 `Avatar / ID / Email / Name / Created`：

- 加载中：显示 `Loading…`
- 请求失败：显示错误文案（`Request failed with status <code>` 等）
- 无数据：表格正文显示 `No users`
- `avatarUrl` 缺失时头像列显示 `—`

新建用户需通过下方 API 调用（页面当前只做读取展示，没有表单）。

---

## 5. 输入输出示例

以下示例的字段与 [packages/shared-types/src/user.ts](packages/shared-types/src/user.ts)、[error.ts](packages/shared-types/src/error.ts) 完全一致。

### 创建用户（POST /api/users）

```bash
curl -X POST http://localhost:3100/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"ada@example.com","name":"Ada","password":"correct-horse"}'
```

请求体类型 `CreateUserRequest`：`{ email: string; name: string; password: string }`。`password` 至少 8 位，只用于在服务端生成 scrypt 加盐哈希，**不会出现在任何响应里**。

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

字段不合法时返回 `400` 与字段级 details：

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request body is invalid",
    "details": [{ "path": "password", "message": "Password must be at least 8 characters" }]
  }
}
```

### 登录（POST /api/auth/login）

```bash
curl -X POST http://localhost:3100/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ada@example.com","password":"correct-horse"}'
```

请求体类型 `LoginRequest`：`{ email: string; password: string }`（`email` 必须是合法邮箱、`password` 不可为空）。

- 凭据匹配：`200` + `LoginResponse`（`{ "user": { ... } }`）
- 邮箱或密码错误：`401` + `{ "error": { "code": "UNAUTHORIZED", "message": "Invalid email or password" } }`
- 请求体格式错误：`400` + `VALIDATION_ERROR`

登录只验证凭据，不签发 token，也不建立会话（见 [§7](#7-当前范围未实现的部分)）。

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
- 未命中：`404` + JSON 错误体 `{ "error": { "code": "NOT_FOUND", "message": "User usr_1 not found" } }`

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
- 会话与鉴权中间件：`POST /api/auth/login` 只校验凭据，不签发 token、不保护任何路由
- CORS 中间件（跨域调用请走 Vite 代理）
- AI 能力集成（`apps/server/src/ai/` 尚未创建）
- `packages/shared-utils`（跨端工具包尚未创建；未来新增时需同步更新 `tsconfig.json` 的 `paths` 与 ESLint boundaries 配置）
- 前端写入表单（页面目前只做列表展示）
- 前端组件测试：web 端仍只有 1 个占位用例，尚未引入 jsdom / Testing Library；测试深度目前集中在 server
