const pool = require('./config/database');

async function updateCameras() {
  try {
    console.log('正在连接数据库...');

    const connection = await pool.getConnection();
    console.log('数据库连接成功！');

    // 清空相机表
    console.log('正在清空相机表...');
    await connection.execute('DELETE FROM cameras');
    console.log('相机表已清空');

    // 插入新的相机数据
    console.log('正在插入新的相机数据...');
    const newCameras = [
      {
        name: '大疆 Action 6 Pro',
        brand: 'DJI',
        model: 'Action 6 Pro',
        price: 150.00,
        description: '4K 120fps 运动相机，防水防抖',
        image_url: '/images/dji-action6pro.jpg',
        status: 'available'
      },
      {
        name: '佳能 CCD 相机',
        brand: 'Canon',
        model: 'CCD',
        price: 80.00,
        description: '复古 CCD 相机，胶片质感',
        image_url: '/images/dji-action6pro.jpg',
        status: 'available'
      },
      {
        name: 'Nikon Z6 II',
        brand: 'Nikon',
        model: 'Z6 II',
        price: 200.00,
        description: '2450万像素全画幅无反，双卡槽设计',
        image_url: '/images/dji-action6pro.jpg',
        status: 'available'
      }
    ];

    for (const camera of newCameras) {
      await connection.execute(
        'INSERT INTO cameras (name, brand, model, price, description, image_url, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [camera.name, camera.brand, camera.model, camera.price, camera.description, camera.image_url, camera.status]
      );
    }

    console.log('新的相机数据插入成功！');

    // 验证数据
    console.log('验证相机数据...');
    const [cameras] = await connection.execute('SELECT * FROM cameras');
    console.log(`相机表中有 ${cameras.length} 条数据：`);
    cameras.forEach(camera => {
      console.log(`${camera.id}. ${camera.name} (${camera.brand} ${camera.model}) - ${camera.status}`);
    });

    connection.release();
    console.log('相机数据更新完成！');
  } catch (error) {
    console.error('数据库操作失败：', error);
  }
}

updateCameras();
