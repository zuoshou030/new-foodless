# 文档：06 - 功能交互走查

> **文件目标**: 从用户的视角，一步步地演示应用核心功能的交互流程，帮助理解产品逻辑。
> **最后更新**: 2024-07-31

## 1. 核心流程：饭缩力体验

这是一个新用户使用主功能时的典型流程。

1.  **访问应用**: 用户首次访问，由于未登录，被 `<ProtectedRoute>` 组件自动重定向到登录页。
2.  **注册/登录**: 用户完成注册或登录，被重定向回首页 `/`。
3.  **显示主界面**: 此时 `<ProtectedRoute>` 验证通过，`<FoodLessApp>` 组件被渲染。`appState.currentStep` 初始值为 `'input'`。
4.  **上传图片**: 用户点击 `<UploadArea>`，选择一张美食图片。
    - **前端**: `handleImageUpload` 被调用，图片文件被存入 `appState.uploadedImage`。UI上显示出图片预览和优雅的成功徽章。
5.  **输入理由**: 用户在 `<FoodInput>` 中输入抵制诱惑的理由。
    - **前端**: `setWeightLossReason` 被调用，理由文本存入 `appState.weightLossReason`。
6.  **注入饭缩力**: 图片和理由都具备后，提交按钮变为可用。用户点击提交。
    - **前端**: `handleSubmit` 被调用。
        - `appState.currentStep` 变为 `'loading'`，全屏加载动画 `<LoadingOverlay>` 出现。
        - `processImage` 被调用，在隐藏的 `<canvas>` 上对图片应用滤镜算法。
        - 处理后的图片被上传到服务器（或直接以DataURL形式使用）。
        - `handleSendMessage` 被调用，将图片、理由、对话历史等信息发送到后端API `/api/ai/chat`。
7.  **显示结果**:
    - **后端**: API处理请求，调用AI大模型生成劝阻/激励文案，并将结果返回。
    - **前端**: `handleSubmit` 接收到API返回结果。
        - `appState.chatHistory` 更新，加入新的AI回复。
        - `appState.processedImage` 更新为处理后的图片URL。
        - `appState.currentStep` 变为 `'result'`，加载动画消失。
        - `<ResultDisplay>` 组件被渲染，展示处理后的图片和完整的对话流。
8.  **继续对话**: 用户可以在 `<ResultDisplay>` 的输入框中继续输入，与AI进行多轮对话，以强化或消解念头。

## 2. 动机管理：核心誓言

1.  **访问页面**: 用户通过导航进入 `/mark` 页面（默认 `section=vow`）。
2.  **获取数据**: `<VowEditor>` 组件挂载，调用 `db.getUserVow` 从数据库获取用户已有的誓言。
    - **新用户**: 获取为空，`isEditing` 状态默认为 `true`，直接进入编辑模式。
    - **老用户**: 获取到数据，组件渲染"查看模式"，展示已有图片和文案。
3.  **进入编辑**: 老用户点击"编辑"按钮，`isEditing` 变为 `true`。
4.  **编辑内容**:
    - 用户修改誓言文本。
    - 用户点击图片，触发 `<input type="file">`，选择新图片后，`handleImageSelect` 将图片文件存入 state，并通过 `URL.createObjectURL` 生成本地预览URL，实现实时预览。
    - 用户点击"AI生成文案"按钮，`handleGenerateAIMotivation` 被调用，向 `/api/vow/generate-motivation` 发送请求，并将返回的文案展示出来。
5.  **保存**: 用户点击"保存"。
    - `handleSave` 被调用，`isSaving` 变为 `true`，UI进入保存中状态。
    - **如果上传了新图片**: 先向 `/api/vow/upload` 发送请求上传图片，获取返回的 `imageUrl`。
    - 调用 `db.upsertUserVow`，将新的文本、图片URL和AI文案（如果使用了）统一保存到数据库。
    - 保存成功后，`isEditing` 变为 `false`，UI返回查看模式，并显示更新后的内容。

## 3. 时光倒流：胜利日志

1.  **访问页面**: 用户导航到 `/mark?section=log`。
2.  **获取列表**: `<VictoryLog>` 组件挂载，调用API `/api/sessions` 获取历史会话列表。
3.  **渲染列表**: 页面以卡片形式展示所有历史记录。
4.  **点击恢复**: 用户点击其中一张卡片。
    - `restoreSession` 函数被调用。
    - 向 `/api/conversations/:sessionId` 发送请求，获取该次会话的**完整对话历史**。
    - 调用全局的 `setAppState` 方法，用获取到的历史数据（图片URL、理由、对话历史等）**完全覆盖**当前应用的状态。
    - `currentStep` 被强制设为 `'result'`。
    - 使用 Next.js 的 `router.push('/')` 跳转回首页。
5.  **无缝衔接**: 用户看到的界面瞬间切换回主应用，并直接显示所选历史会话的结果页，仿佛时光倒流，可以无缝地继续那一次的对话。 