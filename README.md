# ai-monorepo

开源 AI 工程项目 —— 前后端同仓 Monorepo。布局参考 LobeChat，架构遵循 MNN 式前后端严格分离。

## 结构

```
apps/
  web/            前端应用（React + TypeScript + Vite）
  server/         后端 API（Express + TypeScript）
packages/
  shared-types/   前后端契约层：API DTO 与领域类型（零运行时依赖）
  shared-utils/   跨端纯函数工具（零框架依赖，规划中）
```

## 环境要求

- Node.js >= 20
- pnpm >= 9

## 快速开始

```bash
pnpm install
pnpm dev        # 并行启动 web（Vite）与 server（tsx watch）
```

- Web: http://localhost:5173 （/api 已代理到 server）
- API: http://localhost:3100/api/users （可用 `PORT` 环境变量覆盖）

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 并行启动所有 workspace 的 dev 脚本 |
| `pnpm build` | 依次构建所有 workspace |
| `pnpm lint` | 所有 workspace lint |
| `pnpm test` | 所有 workspace 测试 |
| `pnpm typecheck` | 全仓 TypeScript 类型检查 |

## 架构规则

- `apps/` 之间禁止互相导入，只能通过 HTTP API 通信
- 所有 API 请求/响应类型必须定义在 `packages/shared-types`，apps 只能 import
- 后端严格分层：routes → controller → service，禁止跨层调用
- 共享逻辑一律下沉 `packages/`，禁止在 apps 之间复制粘贴

完整规范见 [spec.md](./spec.md)，AI 协作规则见 [.trae/rules/project_rules.md](./.trae/rules/project_rules.md)。
