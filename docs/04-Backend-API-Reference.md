# 文档：04 - 后端API参考手册

> **文件目标**: 为所有后端API端点提供详细的参考，方便前端调用和后端维护。
> **最后更新**: 2024-07-31

## 1. 概述

后端API使用 [Hono](https://hono.dev/) 框架构建，并运行在 Next.js 的 API Routes (`/src/app/api/[[...route]]`) 之上。所有需要认证的端点都由一个统一的认证中间件保护，该中间件会验证请求头中的 `Authorization: Bearer <token>`。

## 2. API模块

### 2.1. 用户模块 (`/api/user`)
> **文件**: `src/app/api/[[...route]]/routes/user.ts`
> **职责**: 处理所有与用户数据相关的操作。

| 方法 | 端点 | 描述 | 请求体/参数 | 返回值 |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/profile` | 获取当前用户的完整资料和统计数据。 | - | `{ profile, stats, user }` |
| `PUT` | `/profile` | 更新当前用户的个人资料。 | `{ "weight_loss_goal": "..." }` | `{ profile }` |
| `GET` | `/sessions` | 分页获取用户的历史会话列表。 | `limit`, `offset` (查询参数) | `{ sessions: [...] }` |
| `GET` | `/sessions/:id`| 获取单个会话的详细信息。 | `id` (路径参数) | `{ session }` |
| `POST`| `/sessions` | 创建一个新的会话记录。 | `{ weightLossReason, ... }` | `{ session }` |
| `GET` | `/conversations/:id` | 获取单个会话下的所有对话记录。 | `id` (路径参数) | `{ conversations: [...] }` |
| `POST`| `/migrate` | 将用户的本地历史数据迁移到云端。 | `{ localData: { ... } }` | `{ migratedSessions, ... }` |

---

### 2.2. 誓言模块 (`/api/vow`)
> **文件**: `src/app/api/[[...route]]/routes/vow.ts`
> **职责**: 处理与"核心誓言"功能相关的操作。

| 方法 | 端点 | 描述 | 请求体/参数 | 返回值 |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/upload` | 上传一张图片作为核心誓言的视觉象征。 | `FormData` (包含'file'字段) | `{ "imageUrl": "..." }` |
| `POST` | `/generate-motivation` | 根据誓言文本，通过AI生成激励文案。 | `{ "vowText": "..." }` | `{ "motivation": "..." }` |

---

### 2.3. AI模块 (`/api/ai`)
> **文件**: `src/app/api/[[...route]]/routes/ai.ts`
> **职责**: 作为AI服务的统一代理和处理器。

| 方法 | 端点 | 描述 | 请求体/参数 | 返回值 |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/chat` | 主对话接口。处理用户图片和输入的理由，返回AI生成的劝阻或激励文案。 | `{ type, userInput, imageData, ... }` | `{ text, isNegative, ... }` |

---

### 2.4. 配置模块 (`/api/config`, `/api/warnings`)
> **文件**: `src/app/api/[[...route]]/routes/misc.ts`
> **职责**: 向前端提供动态配置。

| 方法 | 端点 | 描述 | 请求体/参数 | 返回值 |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/config` | 获取指定类型的配置。 | `type` ('filter' 或 'timing') | `{...}` (配置对象) |
| `GET` | `/warnings` | 获取一组随机的警告/劝阻文案。 | `count` (数量) | `{ texts: [...] }` |

## 3. 认证中间件

所有需要保护的路由（如 `/user/*`, `/vow/*`）都会经过 `src/app/api/[[...route]]/route.ts` 中定义的认证中间件。

**工作流程**:
1. 从请求头的 `Authorization` 中提取 JWT (Access Token)。
2. 使用 `supabase.auth.getUser(jwt)` 来验证 Token 的有效性并解析出用户信息。
3. 如果验证成功，将 `user` 对象注入到 Hono 的请求上下文 (`c.set('user', user)`) 中，供后续的路由处理器使用。
4. 如果验证失败，则直接返回 `401 Unauthorized` 错误，中断请求。

这种设计确保了所有核心API的安全性，并简化了各个路由处理器的逻辑，因为它们可以假定 `c.get('user')` 总是可用的。 