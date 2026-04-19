const pool = require('./config/database');

async function checkExpiredRentals() {
  try {
    console.log('检查到期的租赁记录...');
    
    // 查找所有已到期但状态仍为active的租赁记录
    const [expiredRentals] = await pool.execute(
      `SELECT r.*, c.name as camera_name 
       FROM rentals r 
       JOIN cameras c ON r.camera_id = c.id 
       WHERE r.status = 'active' 
       AND r.end_date < CURDATE()`
    );

    if (expiredRentals.length === 0) {
      console.log('没有到期的租赁记录');
      return;
    }

    console.log(`发现 ${expiredRentals.length} 个到期的租赁记录`);

    // 更新每个到期的租赁记录
    for (const rental of expiredRentals) {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // 更新租赁状态为完成
        await connection.execute(
          'UPDATE rentals SET status = ? WHERE id = ?',
          ['completed', rental.id]
        );

        // 释放相机状态为可用
        await connection.execute(
          'UPDATE cameras SET status = ? WHERE id = ?',
          ['available', rental.camera_id]
        );

        await connection.commit();
        console.log(`已释放相机: ${rental.camera_name} (ID: ${rental.camera_id}), 租赁ID: ${rental.id}`);
      } catch (error) {
        await connection.rollback();
        console.error(`释放相机失败 (租赁ID: ${rental.id}):`, error);
      } finally {
        connection.release();
      }
    }

    console.log('到期租赁记录处理完成');
  } catch (error) {
    console.error('检查到期租赁记录时出错:', error);
  }
}

// 如果直接运行此文件，执行一次检查
if (require.main === module) {
  checkExpiredRentals()
    .then(() => {
      console.log('检查完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('执行失败:', error);
      process.exit(1);
    });
}

module.exports = checkExpiredRentals;