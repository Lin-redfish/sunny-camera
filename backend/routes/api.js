const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/cameras', async (req, res) => {
  try {
    const { status, brand } = req.query;
    let query = 'SELECT * FROM cameras WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (brand) {
      query += ' AND brand = ?';
      params.push(brand);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.execute(query, params);
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('获取相机列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取相机列表失败',
      error: error.message
    });
  }
});

router.get('/cameras/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute('SELECT * FROM cameras WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '相机不存在'
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('获取相机详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取相机详情失败',
      error: error.message
    });
  }
});

router.post('/rent', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { cameraId, userName, userPhone, startDate, endDate } = req.body;

    if (!cameraId || !userName || !userPhone || !startDate || !endDate) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    const [cameraRows] = await connection.execute(
      'SELECT * FROM cameras WHERE id = ? AND status = ?',
      [cameraId, 'available']
    );

    if (cameraRows.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: '相机不可用或不存在'
      });
    }

    const camera = cameraRows[0];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const totalPrice = (camera.price * days).toFixed(2);

    const [rentalResult] = await connection.execute(
      'INSERT INTO rentals (camera_id, user_name, user_phone, start_date, end_date, total_price, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [cameraId, userName, userPhone, startDate, endDate, totalPrice, 'active']
    );

    await connection.execute(
      'UPDATE cameras SET status = ? WHERE id = ?',
      ['rented', cameraId]
    );

    await connection.commit();

    res.json({
      success: true,
      message: '租赁成功',
      data: {
        rentalId: rentalResult.insertId,
        totalPrice: totalPrice,
        days: days
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('租赁相机失败:', error);
    res.status(500).json({
      success: false,
      message: '租赁相机失败',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

router.post('/return', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { rentalId } = req.body;

    if (!rentalId) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: '缺少租赁ID'
      });
    }

    const [rentalRows] = await connection.execute(
      'SELECT * FROM rentals WHERE id = ? AND status = ?',
      [rentalId, 'active']
    );

    if (rentalRows.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: '租赁记录不存在或已完成'
      });
    }

    const rental = rentalRows[0];

    await connection.execute(
      'UPDATE rentals SET status = ? WHERE id = ?',
      ['completed', rentalId]
    );

    await connection.execute(
      'UPDATE cameras SET status = ? WHERE id = ?',
      ['available', rental.camera_id]
    );

    await connection.commit();

    res.json({
      success: true,
      message: '归还成功'
    });
  } catch (error) {
    await connection.rollback();
    console.error('归还相机失败:', error);
    res.status(500).json({
      success: false,
      message: '归还相机失败',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

router.get('/rentals', async (req, res) => {
  try {
    const { userPhone, status } = req.query;
    let query = `
      SELECT r.*, c.name as camera_name, c.brand, c.model 
      FROM rentals r 
      JOIN cameras c ON r.camera_id = c.id 
      WHERE 1=1
    `;
    const params = [];

    if (userPhone) {
      query += ' AND r.user_phone = ?';
      params.push(userPhone);
    }

    if (status) {
      query += ' AND r.status = ?';
      params.push(status);
    }

    query += ' ORDER BY r.created_at DESC';

    const [rows] = await pool.execute(query, params);
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('获取租赁记录失败:', error);
    res.status(500).json({
      success: false,
      message: '获取租赁记录失败',
      error: error.message
    });
  }
});

// 管理员API - 修改预约信息
router.put('/rentals/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { userName, userPhone, startDate, endDate, status } = req.body;

    if (!id) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: '缺少预约ID'
      });
    }

    // 获取原预约信息
    const [rentalRows] = await connection.execute(
      'SELECT * FROM rentals WHERE id = ?',
      [id]
    );

    if (rentalRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: '预约记录不存在'
      });
    }

    const rental = rentalRows[0];
    const updateData = {};

    // 更新用户信息
    if (userName) updateData.user_name = userName;
    if (userPhone) updateData.user_phone = userPhone;
    if (status) updateData.status = status;

    // 更新日期和价格
    if (startDate || endDate) {
      const newStartDate = startDate || rental.start_date;
      const newEndDate = endDate || rental.end_date;
      updateData.start_date = newStartDate;
      updateData.end_date = newEndDate;

      // 重新计算价格
      const [cameraRows] = await connection.execute(
        'SELECT price FROM cameras WHERE id = ?',
        [rental.camera_id]
      );

      if (cameraRows.length > 0) {
        const cameraPrice = cameraRows[0].price;
        const start = new Date(newStartDate);
        const end = new Date(newEndDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const totalPrice = (cameraPrice * days).toFixed(2);
        updateData.total_price = totalPrice;
      }
    }

    // 构建更新语句
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    const placeholders = fields.map(field => `${field} = ?`).join(', ');

    if (fields.length > 0) {
      values.push(id);
      await connection.execute(
        `UPDATE rentals SET ${placeholders} WHERE id = ?`,
        values
      );
    }

    // 如果状态变为完成，更新相机状态
    if (status === 'completed') {
      await connection.execute(
        'UPDATE cameras SET status = ? WHERE id = ?',
        ['available', rental.camera_id]
      );
    }

    await connection.commit();

    // 获取更新后的预约信息
    const [updatedRows] = await pool.execute(
      'SELECT r.*, c.name as camera_name, c.brand, c.model FROM rentals r JOIN cameras c ON r.camera_id = c.id WHERE r.id = ?',
      [id]
    );

    res.json({
      success: true,
      message: '预约信息已更新',
      data: updatedRows[0]
    });
  } catch (error) {
    await connection.rollback();
    console.error('修改预约信息失败:', error);
    res.status(500).json({
      success: false,
      message: '修改预约信息失败',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

// 管理员API - 续约预约
router.post('/rentals/:id/renew', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { days } = req.body;

    if (!id || !days || days <= 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: '缺少必要参数或参数无效'
      });
    }

    // 获取原预约信息
    const [rentalRows] = await connection.execute(
      'SELECT * FROM rentals WHERE id = ? AND status = ?',
      [id, 'active']
    );

    if (rentalRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: '预约记录不存在或已完成'
      });
    }

    const rental = rentalRows[0];

    // 计算新的结束日期
    const currentEndDate = new Date(rental.end_date);
    const newEndDate = new Date(currentEndDate);
    newEndDate.setDate(newEndDate.getDate() + days);

    // 计算续约费用
    const [cameraRows] = await connection.execute(
      'SELECT price FROM cameras WHERE id = ?',
      [rental.camera_id]
    );

    if (cameraRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: '相机信息不存在'
      });
    }

    const cameraPrice = cameraRows[0].price;
    const additionalPrice = (cameraPrice * days).toFixed(2);
    const newTotalPrice = (parseFloat(rental.total_price) + parseFloat(additionalPrice)).toFixed(2);

    // 更新预约信息
    await connection.execute(
      'UPDATE rentals SET end_date = ?, total_price = ? WHERE id = ?',
      [newEndDate.toISOString().split('T')[0], newTotalPrice, id]
    );

    await connection.commit();

    // 获取更新后的预约信息
    const [updatedRows] = await pool.execute(
      'SELECT r.*, c.name as camera_name, c.brand, c.model FROM rentals r JOIN cameras c ON r.camera_id = c.id WHERE r.id = ?',
      [id]
    );

    res.json({
      success: true,
      message: `预约已续约 ${days} 天`,
      data: updatedRows[0],
      additionalPrice: additionalPrice,
      newTotalPrice: newTotalPrice
    });
  } catch (error) {
    await connection.rollback();
    console.error('续约预约失败:', error);
    res.status(500).json({
      success: false,
      message: '续约预约失败',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

// 管理员API - 取消预约
router.post('/rentals/:id/cancel', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;

    if (!id) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: '缺少预约ID'
      });
    }

    // 获取原预约信息
    const [rentalRows] = await connection.execute(
      'SELECT * FROM rentals WHERE id = ? AND status = ?',
      [id, 'active']
    );

    if (rentalRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: '预约记录不存在或已完成'
      });
    }

    const rental = rentalRows[0];

    // 更新预约状态
    await connection.execute(
      'UPDATE rentals SET status = ? WHERE id = ?',
      ['cancelled', id]
    );

    // 更新相机状态为可用
    await connection.execute(
      'UPDATE cameras SET status = ? WHERE id = ?',
      ['available', rental.camera_id]
    );

    await connection.commit();

    res.json({
      success: true,
      message: '预约已取消'
    });
  } catch (error) {
    await connection.rollback();
    console.error('取消预约失败:', error);
    res.status(500).json({
      success: false,
      message: '取消预约失败',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

// 管理员API - 获取所有预约记录
router.get('/admin/rentals', async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT r.*, c.name as camera_name, c.brand, c.model 
      FROM rentals r 
      JOIN cameras c ON r.camera_id = c.id 
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND r.status = ?';
      params.push(status);
    }

    query += ' ORDER BY r.created_at DESC';

    const [rows] = await pool.execute(query, params);
    res.json({
      success: true,
      data: rows,
      total: rows.length
    });
  } catch (error) {
    console.error('获取所有预约记录失败:', error);
    res.status(500).json({
      success: false,
      message: '获取所有预约记录失败',
      error: error.message
    });
  }
});

// 聊天相关API

// 获取会话列表
router.get('/conversations', async (req, res) => {
  try {
    const { user_id } = req.query;
    let query = 'SELECT * FROM conversations WHERE status = ?';
    const params = ['active'];

    if (user_id) {
      query += ' AND user_id = ?';
      params.push(user_id);
    }

    query += ' ORDER BY updated_at DESC';

    const [rows] = await pool.execute(query, params);
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('获取会话列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取会话列表失败',
      error: error.message
    });
  }
});

// 获取消息列表
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const [rows] = await pool.execute(
      'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [id, parseInt(limit), parseInt(offset)]
    );

    // 标记消息为已读
    await pool.execute(
      'UPDATE messages SET is_read = TRUE, read_time = NOW() WHERE conversation_id = ? AND is_read = FALSE',
      [id]
    );

    // 更新会话的未读消息数
    await pool.execute(
      'UPDATE conversations SET unread_count = 0 WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      data: rows.reverse() // 按时间正序返回
    });
  } catch (error) {
    console.error('获取消息列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取消息列表失败',
      error: error.message
    });
  }
});

// 发送消息
router.post('/messages', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { conversation_id, sender_type, sender_name, sender_avatar, content, message_type = 'text', user_id, user_name, user_avatar } = req.body;

    if (!content) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: '消息内容不能为空'
      });
    }

    let conversationId = conversation_id;

    // 如果没有会话ID，创建新会话
    if (!conversationId && user_id) {
      // 检查是否已存在会话
      const [existingConversations] = await connection.execute(
        'SELECT id FROM conversations WHERE user_id = ? AND status = ?',
        [user_id, 'active']
      );

      if (existingConversations.length > 0) {
        conversationId = existingConversations[0].id;
      } else {
        // 创建新会话
        const [conversationResult] = await connection.execute(
          'INSERT INTO conversations (user_id, user_name, user_avatar, last_message, last_message_time, status) VALUES (?, ?, ?, ?, ?, ?)',
          [user_id, user_name || '', user_avatar || '', content, new Date(), 'active']
        );
        conversationId = conversationResult.insertId;
      }
    }

    if (!conversationId) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: '缺少会话ID或用户ID'
      });
    }

    // 插入消息
    const [messageResult] = await connection.execute(
      'INSERT INTO messages (conversation_id, sender_type, sender_name, sender_avatar, content, message_type) VALUES (?, ?, ?, ?, ?, ?)',
      [conversationId, sender_type, sender_name || '', sender_avatar || '', content, message_type]
    );

    // 更新会话的最后消息
    await connection.execute(
      'UPDATE conversations SET last_message = ?, last_message_time = NOW(), unread_count = unread_count + 1 WHERE id = ?',
      [content, conversationId]
    );

    await connection.commit();

    // 获取完整的消息信息
    const [newMessages] = await pool.execute(
      'SELECT * FROM messages WHERE id = ?',
      [messageResult.insertId]
    );

    res.json({
      success: true,
      message: '消息发送成功',
      data: newMessages[0]
    });
  } catch (error) {
    await connection.rollback();
    console.error('发送消息失败:', error);
    res.status(500).json({
      success: false,
      message: '发送消息失败',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

// 关闭会话
router.put('/conversations/:id/close', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.execute(
      'UPDATE conversations SET status = ? WHERE id = ?',
      ['closed', id]
    );

    res.json({
      success: true,
      message: '会话已关闭'
    });
  } catch (error) {
    console.error('关闭会话失败:', error);
    res.status(500).json({
      success: false,
      message: '关闭会话失败',
      error: error.message
    });
  }
});

// 获取未读消息数
router.get('/conversations/:id/unread', async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(
      'SELECT unread_count FROM conversations WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      data: {
        unread_count: rows.length > 0 ? rows[0].unread_count : 0
      }
    });
  } catch (error) {
    console.error('获取未读消息数失败:', error);
    res.status(500).json({
      success: false,
      message: '获取未读消息数失败',
      error: error.message
    });
  }
});

// 登录相关API

// 管理员登录
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 验证用户名和密码
    // 这里使用硬编码的方式，实际项目中应该从数据库中查询
    if (username === 'admin' && password === 'admin123') {
      const admin = {
        id: 1,
        username: 'admin',
        name: '管理员',
        role: 'admin'
      };

      res.json({
        success: true,
        message: '登录成功',
        data: admin
      });
    } else {
      res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({
      success: false,
      message: '登录失败',
      error: error.message
    });
  }
});

// 获取当前登录用户信息
router.get('/admin/me', async (req, res) => {
  try {
    // 这里应该从会话或token中获取用户信息
    // 为了简化，我们直接返回管理员信息
    const admin = {
      id: 1,
      username: 'admin',
      name: '管理员',
      role: 'admin'
    };

    res.json({
      success: true,
      data: admin
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      error: error.message
    });
  }
});

// 微信小程序用户登录
router.post('/user/login', async (req, res) => {
  try {
    const { openid, nickname, avatar } = req.body;

    if (!openid) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    // 检查用户是否存在
    const [existingUsers] = await pool.execute(
      'SELECT * FROM users WHERE openid = ?',
      [openid]
    );

    let user;

    if (existingUsers.length > 0) {
      // 用户存在，更新信息
      await pool.execute(
        'UPDATE users SET nickname = ?, avatar = ? WHERE openid = ?',
        [nickname, avatar, openid]
      );
      user = existingUsers[0];
    } else {
      // 用户不存在，创建新用户
      const [result] = await pool.execute(
        'INSERT INTO users (openid, nickname, avatar) VALUES (?, ?, ?)',
        [openid, nickname, avatar]
      );
      user = {
        id: result.insertId,
        openid,
        nickname,
        avatar
      };
    }

    // 生成会话密钥
    const sessionKey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7天过期

    // 保存会话
    await pool.execute(
      'INSERT INTO user_sessions (user_id, session_key, expires_at) VALUES (?, ?, ?)',
      [user.id, sessionKey, expiresAt]
    );

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user,
        sessionKey,
        expiresAt
      }
    });
  } catch (error) {
    console.error('用户登录失败:', error);
    res.status(500).json({
      success: false,
      message: '登录失败',
      error: error.message
    });
  }
});

// 获取用户信息
router.get('/user/me', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '缺少用户ID'
      });
    }

    const [users] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      error: error.message
    });
  }
});

// 更新用户信息
router.put('/user/me', async (req, res) => {
  try {
    const { userId, phone } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '缺少用户ID'
      });
    }

    await pool.execute(
      'UPDATE users SET phone = ? WHERE id = ?',
      [phone, userId]
    );

    const [users] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: '用户信息已更新',
      data: users[0]
    });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '更新用户信息失败',
      error: error.message
    });
  }
});

// 评价相关API

// 提交评价
router.post('/reviews', async (req, res) => {
  try {
    const { rentalId, star, content } = req.body;

    if (!rentalId || !star || !content) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    // 检查租赁记录是否存在
    const [rentalRows] = await pool.execute(
      'SELECT * FROM rentals WHERE id = ?',
      [rentalId]
    );

    if (rentalRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '租赁记录不存在'
      });
    }

    // 插入评价记录
    const [result] = await pool.execute(
      'INSERT INTO reviews (rental_id, star, content, created_at) VALUES (?, ?, ?, ?)',
      [rentalId, star, content, new Date()]
    );

    res.json({
      success: true,
      message: '评价成功',
      data: {
        reviewId: result.insertId
      }
    });
  } catch (error) {
    console.error('提交评价失败:', error);
    res.status(500).json({
      success: false,
      message: '提交评价失败',
      error: error.message
    });
  }
});

// 获取评价列表
router.get('/reviews', async (req, res) => {
  try {
    const { rentalId } = req.query;
    let query = 'SELECT * FROM reviews WHERE 1=1';
    const params = [];

    if (rentalId) {
      query += ' AND rental_id = ?';
      params.push(rentalId);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.execute(query, params);
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('获取评价列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取评价列表失败',
      error: error.message
    });
  }
});

module.exports = router;