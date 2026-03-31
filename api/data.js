import { Redis } from '@upstash/redis';

// 自动读取Vercel注入的环境变量，无需手动填密钥
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// 全局默认数据（所有管理员共用，新增账号/业务字段在这里改）
const DEFAULT_GLOBAL_DATA = {
  // 管理员账号配置，新增账号直接在这里加一行即可
  userList: [
    { username: '公共艺术科管理员1', password: '123456', role: 'admin' },
    // 示例：新增账号 { username: '管理员2', password: '654321', role: 'admin' },
  ],
  // 核心业务数据，所有操作自动同步云端，新增字段直接在这里加
  orderList: [], // 派工单列表
  checkList: [], // 审核记录
  fileList: [],  // 附件/照片记录
};

export default async function handler(req, res) {
  // 跨域配置，保证页面正常访问
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 预检请求处理，不用改
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 【GET请求】前端拉取云端全量共用数据
    if (req.method === 'GET') {
      let globalData = await redis.get('repair_global_data');
      // 云端无数据时，自动初始化默认数据
      if (!globalData) {
        await redis.set('repair_global_data', DEFAULT_GLOBAL_DATA);
        globalData = DEFAULT_GLOBAL_DATA;
      }
      return res.status(200).json({
        code: 200,
        data: globalData,
        msg: '数据拉取成功'
      });
    }

    // 【POST请求】前端同步数据到云端（新增/编辑/删除都会调用）
    if (req.method === 'POST') {
      const newData = req.body;
      // 校验数据，避免空数据覆盖
      if (!newData || typeof newData !== 'object') {
        return res.status(400).json({ code: 400, msg: '数据格式错误' });
      }
      // 全量更新云端数据
      await redis.set('repair_global_data', newData);
      return res.status(200).json({
        code: 200,
        msg: '数据同步成功',
        data: newData
      });
    }

    // 不支持的请求方法
    res.setHeader('Allow', ['GET', 'POST', 'OPTIONS']);
    return res.status(405).json({ code: 405, msg: '不支持的请求方法' });

  } catch (error) {
    console.error('接口错误：', error);
    return res.status(500).json({
      code: 500,
      msg: '服务器错误，请稍后重试',
      error: error.message
    });
  }
}
