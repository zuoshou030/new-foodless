/**
 * @/app/api/[[...route]]/routes/ai.ts
 *
 * 功能说明：处理核心的AI调用逻辑和相关端点。
 *           这个文件是整个应用的"AI大脑中枢"，负责编排和执行所有与AI模型的复杂交互。
 * 包含的函数：
 * - getDynamicPrompt: 根据类型和参数动态生成AI prompt。
 * - callAI: 调用AI服务的核心封装函数，支持多模态和上下文。
 * - POST /generate-text: 应用主功能的AI文本生成端点，供前端直接调用。
 * 最后修改时间：2024年7月26日
 */
import { Hono } from 'hono'
import type { User } from '@supabase/supabase-js'
import { CONFIG } from '@/config'
import { PROMPT_CONFIG } from '@/config/prompts'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ServerDatabaseService } from '@/lib/supabase/database'

type HonoEnv = {
    Variables: {
      user: User
    }
}

// --- AI配置中心（从统一配置导入） ---
const AI_CONFIG = {
    ...CONFIG.ai,
    textModel: {
        ...CONFIG.ai.textModel,
        key: process.env.AI_API_KEY,
    },
    visionModel: {
        ...CONFIG.ai.visionModel,
        key: process.env.VISION_API_KEY,
    }
}

// --- Prompt模板（从统一配置导入） ---
const { main: MAIN_PROMPTS, system: SYSTEM_PROMPTS, vow: VOW_PROMPTS } = PROMPT_CONFIG

/**
 * @function getDynamicPrompt
 * @description 根据请求类型和参数，动态地组合生成系统提示词和用户提示词。
 *              这是实现个性化AI回复的唯一入口和"中央厨房"。
 * @param {string} type - 请求类型，如 'disgusting', 'motivating', 'dialogue', 'vowMotivation'。
 * @param {string} [userInput] - 用户输入的文本内容，例如理由或对话消息。
 * @param {string} [weightLossReason] - 用户的减肥原因。
 * @returns {{systemPrompt: string | undefined, userPrompt: string}} 返回包含系统和用户提示词的对象。
 */
export function getDynamicPrompt(type: string, userInput?: string, weightLossReason?: string) {
    let systemPrompt: string | undefined = undefined;
    let userPrompt: string = '';
    const reason = weightLossReason && weightLossReason.trim() !== '' ? weightLossReason : '变得更好';

    switch (type) {
        case 'disgusting':
            systemPrompt = SYSTEM_PROMPTS.disgusting.replace(/{weightLossReason}/g, reason);
            userPrompt = MAIN_PROMPTS.disgusting
                .replace(/{weightLossReason}/g, reason);
            break;
        
        case 'motivating':
            systemPrompt = SYSTEM_PROMPTS.motivating;
            userPrompt = MAIN_PROMPTS.motivating
                .replace(/{weightLossReason}/g, reason);
            break;
        
        case 'dialogue':
            systemPrompt = SYSTEM_PROMPTS.dialogue.replace(/{weightLossReason}/g, reason);
            userPrompt = userInput || '我还是想不太明白，还是想吃。';
            break;

        case 'vowMotivation':
            systemPrompt = SYSTEM_PROMPTS.vowMotivation;
            userPrompt = VOW_PROMPTS.motivational.replace(/{vowText}/g, userInput || '');
            break;

        case 'recordAnalysis':
            systemPrompt = SYSTEM_PROMPTS.recordAnalysis.replace(/{weightLossReason}/g, reason);
            userPrompt = userInput || '我想记录一下最近的感受。';
            break;

        default:
            // 默认安全后备，尽管代码逻辑上不应执行到此处
            console.warn(`未知的 请求类型: ${type}, 使用默认后提示词模板。`);
            systemPrompt = SYSTEM_PROMPTS.dialogue;
            userPrompt = userInput || '请告诉我你的困惑。';
            break;
    }
    console.log('systemPrompt:', systemPrompt)
    console.log('userPrompt:', userPrompt)
    return { systemPrompt, userPrompt };
}

/**
 * @function callAI
 * @description 封装了与第三方AI服务交互的核心逻辑，是整个应用的"AI引擎"。
 *              🔥 关键：确保接收到的imageData是经过恶心滤镜处理后的图片
 * @param {string} prompt - 用户的主要输入或提示。
 * @param {string} type - 请求类型，用于决定内部逻辑和参数。
 * @param {string} [imageData] - Base64编码的图片数据（应该是恶心滤镜处理后的）。
 * @param {any[]} [conversationHistory] - 对话历史记录，用于实现多轮对话。
 * @param {string} [systemPrompt] - 外部传入的系统提示词。
 * @returns {Promise<object>} 返回包含AI生成内容的标准格式对象。
 */
export async function callAI(prompt: string, type: string, imageData?: string, conversationHistory?: any[], systemPrompt?: string) {
    console.log(`🤖 开始调用AI服务... 类型: ${type}`);
    
    // 🔍 验证图片数据是否是处理后的
    if (imageData) {
        console.log('📸 AI接收到的图片数据验证:');
        console.log('  - 数据格式:', imageData.startsWith('data:image/') ? '✅ Base64图片 (正确)' : '❌ 非Base64格式');
        console.log('  - 数据大小:', Math.round(imageData.length / 1024), 'KB');
        console.log('  - 预期内容: 经过恶心滤镜处理后的图片');
        
        if (!imageData.startsWith('data:image/')) {
            console.warn('⚠️ 警告: 接收到的图片数据格式异常，可能不是处理后的图片');
        }
    }

    let config;
    let messages: any[] = [];
    let maxTokens = 1024; // 默认的max_tokens值

    // 步骤1: (可选) 如果传入了系统提示词，则将其作为对话的第一条消息。
    if (systemPrompt) {
        messages.push({ role: "system", content: systemPrompt });
    }

    // 步骤2: 根据不同场景，构建发送给AI的消息体(payload)。
    // 场景一: 图像识别 (如果提供了图片数据且服务器开启了识图功能)
    if (imageData && AI_CONFIG.enableImageRecognition) {
        console.log('🖼️ 使用图像识别模型 - 发送恶心滤镜处理后的图片');
        config = AI_CONFIG.visionModel; // 选择视觉模型配置
        maxTokens = type === 'motivating' ? config.maxTokens.motivating : config.maxTokens.disgusting;
        
        const userMessageContent: any[] = [{ type: "text", text: prompt }];
        if (prompt.trim() === '') { // 优化：如果用户没有输入文字，则只发送图片
             userMessageContent.splice(0,1)
        }
        // 🎯 将恶心滤镜处理后的图片数据加入消息体
        userMessageContent.push({ type: "image_url", image_url: { url: imageData } });

        messages.push({
            role: "user",
            content: userMessageContent
        });

    // 场景二: 多轮对话 (如果提供了对话历史记录)
    } else if (type === 'dialogue' && conversationHistory && conversationHistory.length > 0) {
        console.log('💬 处理多轮对话，并附加上下文历史');
        config = AI_CONFIG.textModel; // 对话使用纯文本模型
        maxTokens = config.maxTokens.dialogue;

        // 将应用的对话历史格式，转换为AI模型要求的标准格式。
        const convertedHistory = conversationHistory.map((msg: any) => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
        }));
        // 将历史记录和当前用户输入一起加入消息体，实现上下文关联。
        messages.push(...convertedHistory, { role: "user", content: prompt });

    // 场景三: 带历史记录的激励文案
    } else if (type === 'motivating' && conversationHistory && conversationHistory.length > 0) {
        console.log(`💪 处理带上下文历史的激励文案 (类型: ${type})`);
        config = AI_CONFIG.textModel; // 激励文案使用纯文本模型
        maxTokens = config.maxTokens.motivating; // 使用motivating自己的maxTokens配置

        // 将应用的对话历史格式，转换为AI模型要求的标准格式。
        const convertedHistory = conversationHistory.map((msg: any) => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
        }));
        // 将历史记录和当前用户输入一起加入消息体，实现上下文关联。
        messages.push(...convertedHistory, { role: "user", content: prompt });
    
    // 场景四: 带历史记录的记录分析
    } else if (type === 'recordAnalysis' && conversationHistory && conversationHistory.length > 0) {
        console.log(`📝 处理带上下文历史的记录分析 (类型: ${type})`);
        config = AI_CONFIG.textModel; // 记录分析使用纯文本模型
        maxTokens = config.maxTokens.dialogue; // 使用dialogue的maxTokens配置，因为需要更多token进行分析

        // 将应用的对话历史格式，转换为AI模型要求的标准格式。
        const convertedHistory = conversationHistory.map((msg: any) => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
        }));
        // 将历史记录和当前用户输入一起加入消息体，实现上下文关联。
        messages.push(...convertedHistory, { role: "user", content: prompt });
    
    // 场景五: 普通纯文本生成
    } else {
        console.log('📝 使用纯文本模型 (无历史记录)');
        config = AI_CONFIG.textModel;
        // 根据不同文本类型，精细化控制AI生成内容的长度(max_tokens)。
        if (type === 'vowMotivation') {
            console.log('✨ 为核心誓言生成激励文案');
            maxTokens = config.maxTokens.vowMotivation;
        } else if (type === 'motivating') {
            maxTokens = config.maxTokens.motivating;
        } else if (type === 'disgusting') {
            maxTokens = config.maxTokens.disgusting;
        } else if (type === 'recordAnalysis') {
            console.log('📝 生成记录分析文案 (无历史记录)');
            maxTokens = config.maxTokens.dialogue; // 记录分析需要更多token
        }
        messages = [{ role: "user", content: prompt }];
    }

    if (!config || !config.key) {
        throw new Error('AI服务未正确配置，请检查环境变量和配置文件');
    }
    
    console.log(`🧠 使用模型: ${config.model}, Max Tokens: ${maxTokens}`);
    if (imageData) {
        console.log('📸 正在发送恶心滤镜处理后的图片给AI进行分析');
    }

    // ⏱️ 步骤3: 记录开始时间，准备调用AI
    const startTime = performance.now();

    try {
        const response = await fetch(config.url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.key}`, // 安全地使用后端环境变量中的API Key
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: config.model,
                messages: messages,
                temperature: config.temperature,
                max_tokens: maxTokens
            })
        });
        
        // ⏱️ 步骤4: 记录结束时间并计算耗时
        const endTime = performance.now();
        const duration = (endTime - startTime)/1000;
        console.log(`⏱️ AI请求耗时: ${duration.toFixed(2)}s`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ AI服务请求失败:', response.status, errorText);
            throw new Error(`AI服务请求失败: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        console.log('✅ AI服务响应:', JSON.stringify(data, null, 2));

        // 步骤5: 解析AI返回的数据，并以统一格式返回给调用方
        if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
            const content = data.choices[0].message.content.trim();
            // 📄 打印回复字符数
            console.log(`📄 AI回复字符数: ${content.length}`);

            return {
                success: true,
                content: content,
            };
        } else {
            console.error('❌ AI响应格式不正确:', data);
            return { success: false, error: 'AI响应格式不正确' };
        }
    } catch (error) {
        console.error('❌ 调用AI服务时出错:', error);
        throw error;
    }
}

/**
 * @function generateAiResponseLogic
 * @description 统一的AI响应生成逻辑处理器，是后端所有AI功能的核心。
 *              它封装了获取提示词、调用AI、保存对话记录等所有步骤。
 * @param {User} user - 当前操作的用户对象。
 * @param {any} body - 从API请求中解析出的body对象。
 * @returns {Promise<object>} 返回一个包含AI生成文本和调试信息的对象。
 */
export async function generateAiResponseLogic(user: User, body: any) {
    const { type, userInput, imageData, sessionId, conversationHistory, weightLossReason } = body;

    console.log('=== (统一逻辑处理器)开始处理AI请求, 用户ID:', user.id, '===');
    console.log('请求类型:', type);

    // 验证请求类型
    if (!type || !['disgusting', 'motivating', 'dialogue', 'vowMotivation', 'recordAnalysis'].includes(type)) {
        throw new Error('无效的请求类型');
    }

    // 核心决策逻辑：判断模式
    const isUseVision = imageData && AI_CONFIG.enableImageRecognition;
    const hasHistory = Array.isArray(conversationHistory) && conversationHistory.length > 0;
    const isContinueConversation = hasHistory && (type === 'motivating' || type === 'dialogue' || type === 'recordAnalysis');

    console.log('判断结果 - 是否使用识图:', isUseVision);
    console.log('判断结果 - 是否为延续对话:', isContinueConversation);

    // 决定有效的Prompt类型
    let effectiveType = type;
    if (isContinueConversation && type === 'motivating' && conversationHistory.length > 1) {
        effectiveType = 'motivatingContinuation';
    }

    // 获取提示词
    const { systemPrompt, userPrompt } = getDynamicPrompt(effectiveType, userInput, weightLossReason);

    // 调用AI
    let result;
    if (isContinueConversation) {
        result = await callAI(userPrompt, type, undefined, conversationHistory);
    } else if (isUseVision) {
        result = await callAI(userPrompt, type, imageData, [], systemPrompt);
    } else {
        result = await callAI(userPrompt, type, undefined, [], systemPrompt);
    }

    if (!result || !result.content) {
        throw new Error('AI未能生成有效内容');
    }
    
    // 持久化对话记录到数据库
    const supabase = createServerSupabaseClient();
    const serverDb = new ServerDatabaseService(supabase);
    let currentSessionId = sessionId;
    
    // 保存对话
    if (type !== 'dialogue' && weightLossReason) {
        if (!currentSessionId) {
            console.log('创建新会话...')
            const dbSession = await serverDb.createSession(
                user.id,
                weightLossReason,
                undefined,
                undefined
            );
            
            if (dbSession) {
                currentSessionId = dbSession.id;
                console.log('新会话创建成功:', currentSessionId);
            } else {
                console.warn('会话创建失败，但继续处理请求');
            }
        } else {
            const dbSession = await serverDb.getSession(currentSessionId);
            if (dbSession) {
                currentSessionId = dbSession.id;
            } else {
                console.warn('指定的会话不存在:', currentSessionId);
                currentSessionId = null;
            }
        }
        
        // 保存AI的回答
        if (currentSessionId && result?.content) {
            const conversation = await serverDb.createConversation(
                currentSessionId,
                'ai',
                result.content,
                type === 'disgusting'
            );
            
            if (conversation) {
                console.log('AI对话保存成功');
            } else {
                console.warn('AI对话保存失败');
            }
        }
    } else if (type === 'dialogue' && currentSessionId) {
        if (userInput) {
            await serverDb.createConversation(
                currentSessionId,
                'user',
                userInput,
                true
            );
        }
        
        if (result?.content) {
            await serverDb.createConversation(
                currentSessionId,
                'ai',
                result.content,
                true
            );
        }
    }

    // 返回标准化的结果对象
    return {
        text: result.content,
        type,
        usedImageRecognition: isUseVision,
        continuedConversation: isContinueConversation,
        sessionId: currentSessionId,
    };
}


const ai = new Hono<HonoEnv>()

/**
 * @endpoint POST /api/generate-text
 * @description 应用主功能的AI文本生成端点。它现在是一个轻量级的包装器。
 *              所有核心逻辑都已委托给 generateAiResponseLogic 函数处理。
 * @param {object} c.req.json() - 包含AI请求参数的JSON对象。
 * @returns {Response} 返回AI生成的文本及其他处理信息。
 */
ai.post('/generate-text', async (c) => {
    try {
        const user = c.get('user');
        const body = await c.req.json();
        
        const responseData = await generateAiResponseLogic(user, body);

        return c.json(responseData);

    } catch (error: any) {
        console.error('Generate Text Error:', error);
        const errorMessage = error instanceof Error ? error.message : '服务暂时不可用';
        return c.json({ error: errorMessage }, 500);
    }
});

export default ai 