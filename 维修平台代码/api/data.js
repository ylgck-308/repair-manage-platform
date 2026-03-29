import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // 跨域处理
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 获取数据
    if (req.method === 'GET') {
      const { key } = req.query;
      if (key === 'all') {
        // 获取所有数据
        const allKeys = await kv.keys('*');
        const allData = {};
        for (const k of allKeys) {
          allData[k] = await kv.get(k);
        }
        return res.status(200).json(allData);
      }
      // 获取单个key数据
      const data = await kv.get(key);
      return res.status(200).json(data || null);
    }

    // 保存数据
    if (req.method === 'POST') {
      const { key, value, batch } = req.body;
      // 批量保存
      if (batch) {
        await kv.mset(batch);
        return res.status(200).json({ success: true });
      }
      // 单个保存
      await kv.set(key, value);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: '不支持的请求方法' });
  } catch (error) {
    console.error('数据操作失败:', error);
    return res.status(500).json({ error: '服务器内部错误', detail: error.message });
  }
}

export const config = {
  runtime: 'edge',
};
