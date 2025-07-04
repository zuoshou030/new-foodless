/**
 * @/app/api/[[...route]]/routes/vow.ts
 *
 * 功能说明：处理与"核心誓言"(Vow)功能相关的API端点。
 *           "核心誓言"是本应用的一个特色功能，旨在帮助用户设定和坚持一个长期的、有意义的目标。
 * 包含的端点：
 * - POST /vow/upload: 上传一张图片作为核心誓言的视觉象征。
 * - POST /vow/generate-motivation: 根据用户输入的誓言文本，通过AI生成一段激励人心的文案。
 * 最后修改时间：2024年7月26日
 */
import { Hono } from 'hono'
import type { User } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { generateAiResponseLogic } from './ai'

type HonoEnv = {
  Variables: {
    user: User
  }
}

const vow = new Hono<HonoEnv>()

/**
 * @endpoint POST /api/vow/upload
 * @description 上传核心誓言的背景图片。
 *              这个接口负责接收前端上传的图片文件，并将其安全地存入Supabase的云存储桶中。
 * @param {FormData} c.req.parseBody() - 请求体应为包含'file'字段的表单数据。
 * @returns {Response} 返回图片的公开访问URL，例如 { "imageUrl": "https://<...>/public/vow-images/..." }。
 */
vow.post('/upload', async (c) => {
  // 步骤1：从上下文中安全地获取用户信息
  const user = c.get('user');

  // 步骤2: 解析表单数据。使用 c.req.parseBody() 是Hono推荐的方式，对不同环境（如Edge）有更好的兼容性。
  console.log('🔍 开始解析上传数据...');
  const body = await c.req.parseBody();
  const file = body['file'];

  if (!file || typeof file === 'string') {
    console.log('❌ 文件验证失败 - 收到的是字符串或空值');
    return c.json({ error: '未提供有效文件' }, 400);
  }

  console.log('✅ 文件验证成功 - 名称:', file.name, '大小:', file.size, '类型:', file.type);

  // 步骤3: 上传到Supabase Storage。
  console.log('🔍 开始上传到Supabase Storage...');
  const supabase = createServerSupabaseClient();
  // 关键设计：文件路径包含了用户ID，确保了每个用户的文件都存储在自己的"文件夹"下，实现了数据的安全隔离。
  // "public/" 表示这个存储桶的文件可以通过公开URL访问。
  const filePath = `${user.id}/vow-${Date.now()}.${file.name.split('.').pop()}`;
  console.log('🔍 上传路径:', filePath);
  
  const { error: uploadError } = await supabase.storage
    .from('vow-images') // 指定要操作的存储桶名称
    .upload(filePath, file, {
      cacheControl: '3600', // 设置CDN缓存时间为1小时，优化后续访问速度
      upsert: false // 设置为false，如果文件已存在则会报错，防止意外覆盖
    });

  if (uploadError) {
    console.error('❌ Supabase图片上传失败:', uploadError);
    return c.json({ error: '上传图片失败，请稍后重试' }, 500);
  }

  console.log('✅ Supabase Storage上传成功');

  // 步骤4: 获取上传后文件的公开访问URL。
  //        这个URL可以直接在前端的<img>标签中使用。
  console.log('🔍 获取公开URL...');
  const { data: { publicUrl } } = supabase.storage
    .from('vow-images')
    .getPublicUrl(filePath);

  if (!publicUrl) {
    console.error('❌ 获取图片URL失败');
    return c.json({ error: '获取图片URL失败' }, 500);
  }
  
  // 步骤5: 将图片的公开URL返回给前端。
  console.log('✅ 图片上传完成，返回URL:', publicUrl);
  return c.json({ imageUrl: publicUrl });
});

/**
 * @endpoint POST /api/vow/generate-motivation
 * @description 根据用户输入的誓言文本，请求AI生成一段激励文案。
 *              这是一个AI赋能功能，旨在将用户抽象的目标具体化为有力量的文字，增强其动机。
 * @param {object} c.req.json() - 请求体应包含 { "vowText": "用户的誓言内容" }。
 * @returns {Response} 返回AI生成的激励文案，例如 { "motivation": "..." }。
 */
vow.post('/generate-motivation', async (c) => {
  // 从上下文中获取用户信息
  const user = c.get('user');

  // 步骤1: 从请求体中获取用户输入的誓言文本。
  const { vowText } = await c.req.json();
  if (!vowText || typeof vowText !== 'string' || vowText.trim() === '') {
    return c.json({ error: '未提供有效的誓言文本' }, 400);
  }

  // 步骤2: 构建调用统一AI逻辑处理器所需的请求体。
  const requestBody = {
    type: 'vowMotivation',
    userInput: vowText,
    // 对于此特定场景，以下参数为可选或不需要
    // imageData: undefined,
    // sessionId: undefined,
    // conversationHistory: [],
    // weightLossReason: undefined 
  };

  // 步骤3: 调用统一的AI逻辑处理器。
  try {
    const aiResponse = await generateAiResponseLogic(user, requestBody);

    if (aiResponse && aiResponse.text) {
      // 成功获取AI内容后，返回给前端
      return c.json({ motivation: aiResponse.text });
    } else {
      throw new Error('AI未能生成有效内容');
    }
  } catch (error) {
    console.error('AI激励文案生成失败:', error);
    const errorMessage = error instanceof Error ? error.message : 'AI服务暂时不可用，请稍后重试';
    return c.json({ error: errorMessage }, 500);
  }
});

export default vow 