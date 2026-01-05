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

module.exports = router;