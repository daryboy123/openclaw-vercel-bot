export default async function handler(req, res) {
  // 1. 仅允许 POST 请求
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405.4).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const authHeader = req.headers.authorization;
    const apiKey = process.env.AGNES_API_KEY;

    // 2. 鉴权校验
    if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
      return res.status(401).json({ error: "Authentication failed (HTTP 401)" });
    }

    const { model, messages } = req.body;

    // 3. 请求上游 Agnes API
    const upstreamResponse = await fetch("https://api.agnes.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || "agnes-3.0-flash",
        messages: messages || []
      })
    });

    const data = await upstreamResponse.json();

    // 4. 严格解析上游返回的文本内容
    const replyContent = 
      data.choices?.[0]?.message?.content || 
      data.choices?.[0]?.text || 
      data.reply || 
      "暂无回复";

    // 5. 按照标准格式返回给前端/插件
    return res.status(200).json({
      reply: replyContent,
      raw: data // 附带原始返回方便调试
    });

  } catch (error) {
    console.error("Vercel Proxy Error:", error);
    return res.status(500).json({ reply: "暂无回复", error: error.message });
  }
}
