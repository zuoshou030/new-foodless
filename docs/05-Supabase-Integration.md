# 文档：05 - Supabase 集成指南

> **文件目标**: 详细说明项目如何与Supabase进行集成，包括认证、数据库和服务端客户端。
> **最后更新**: 2024-07-31

## 1. 概述

[Supabase](https://supabase.com/) 是本项目的核心后端基石，提供了认证、数据库、文件存储等一系列服务。项目通过 `lib/supabase/` 目录下的封装与 Supabase 进行交互。

## 2. 认证 (Authentication)

项目的用户认证流程完全由 Supabase Auth 驱动。

### 2.1. 客户端认证流程 (`AuthProvider.tsx`)
- **监听状态**: `src/components/auth/AuthProvider.tsx` 使用 Supabase 客户端SDK的 `onAuthStateChange` 方法来实时监听用户登录状态的变化。
- **全局上下文**: 它将获取到的 `user` 和 `session` 对象通过 React Context 提供给整个应用。任何子组件都可以通过 `useAuth()` Hook 访问这些信息。
- **Token管理**: Supabase 的客户端库会自动处理 Access Token 和 Refresh Token 的存储与刷新，开发者无需手动干预。

### 2.2. 服务端认证流程 (API中间件)
- **Token验证**: 后端API通过认证中间件，使用 `supabase.auth.getUser(jwt)` 方法验证从前端请求头传来的 Access Token，从而识别用户身份。
- **安全的服务端操作**: 只有在验证通过后，后端逻辑才能执行需要权限的操作，如读写该用户的数据。

## 3. 数据库 (Database)

### 3.1. 数据库服务封装 (`database.ts`)
- **文件**: `src/lib/supabase/database.ts`
- **目的**: 为了避免在业务代码中直接编写SQL查询，项目将所有数据库操作封装成了语义化的函数。
- **`ServerDatabaseService` 类**: 这个类封装了所有需要在**服务端**执行的数据库操作。它接收一个服务端Supabase客户端实例作为参数，并提供诸如 `getUserProfile`, `getUserStats`, `createSession` 等方法。
- **`db` 对象**: 这是一个包含了所有数据库操作方法的单例对象，方便在代码中统一调用，例如 `db.getUserVow(...)`。

**示例**:
```typescript
// bad: 在业务代码中直接写查询
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();

// good: 调用封装好的服务
const profile = await db.getUserProfile(userId);
```

### 3.2. 行级安全策略 (Row Level Security - RLS)
为了实现数据的真正安全隔离，项目在 Supabase 的数据库表中启用了 RLS。

- **核心策略**: 大部分表都设置了"用户只能访问自己的数据"的策略。
- **示例 (profiles表)**:
    - `CREATE POLICY "Users can view own profile." ON profiles FOR SELECT USING (auth.uid() = id);`
    - `CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);`
- **优势**: 即使代码层面出现漏洞，RLS 也能在数据库层面提供最后一道安全防线，防止数据被越权访问。

## 4. 服务端客户端 (`server.ts`) vs 客户端 (`client.ts`)

`lib/supabase/` 目录下有两个关键文件，用于创建不同环境下的 Supabase 客户端实例。

- **`client.ts` (`createClient`)**:
    - **环境**: 仅在浏览器（客户端）环境中使用。
    - **密钥**: 使用公开的 `anon key` (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)。
    - **用途**: 主要用于认证（登录/注册）、监听认证状态，以及执行已开启RLS的、安全的读写操作。

- **`server.ts` (`createServerSupabaseClient`)**:
    - **环境**: 仅在 Next.js 服务端环境（如API路由、Server Components）中使用。
    - **密钥**: 使用更高权限的 `service_role key`。这个密钥存储在服务端环境变量中，绝不会暴露给前端。
    - **用途**: 用于执行需要更高权限的操作，例如在认证中间件中验证用户、或者执行一些需要绕过RLS的特殊管理任务。项目中的标准做法是，即使在服务端，也尽量通过 `auth.uid()` 结合RLS来操作数据，以保持一致和安全。 