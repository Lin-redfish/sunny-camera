const pool = require('./config/database');

async function checkDatabase() {
  try {
    console.log('正在连接数据库...');
    
    // 检查数据库连接
    const connection = await pool.getConnection();
    console.log('数据库连接成功！');
    
    // 检查相机表是否存在
    console.log('\n检查相机表是否存在...');
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'cameras'"
    );
    
    if (tables.length === 0) {
      console.log('错误：相机表不存在！');
      console.log('正在创建相机表...');
      
      // 创建相机表
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS cameras (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          brand VARCHAR(255) NOT NULL,
          model VARCHAR(255) NOT NULL,
          price DECIMAL(10, 2) NOT NULL,
          description TEXT,
          image_url VARCHAR(255),
          status ENUM('available', 'rented', 'maintenance') DEFAULT 'available',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      
      console.log('相机表创建成功！');
    } else {
      console.log('相机表已存在。');
    }
    
    // 检查相机表中的数据
    console.log('\n检查相机表中的数据...');
    const [cameras] = await connection.execute(
      'SELECT * FROM cameras'
    );
    
    if (cameras.length === 0) {
      console.log('警告：相机表中没有数据！');
      console.log('正在添加示例相机数据...');
      
      // 添加示例相机数据
      const sampleCameras = [
        {
          name: 'Canon EOS R5',
          brand: 'Canon',
          model: 'EOS R5',
          price: 300.00,
          description: '4500万像素全画幅无反相机，8K视频录制',
          image_url: 'https://example.com/canon-r5.jpg',
          status: 'available'
        },
        {
          name: 'Sony A7 IV',
          brand: 'Sony',
          model: 'A7 IV',
          price: 250.00,
          description: '3300万像素全画幅微单相机，4K视频录制',
          image_url: 'https://example.com/sony-a7iv.jpg',
          status: 'available'
        },
        {
          name: 'Nikon Z7 II',
          brand: 'Nikon',
          model: 'Z7 II',
          price: 280.00,
          description: '4575万像素全画幅无反相机，4K视频录制',
          image_url: 'https://example.com/nikon-z7ii.jpg',
          status: 'available'
        },
        {
          name: 'Fujifilm X-T4',
          brand: 'Fujifilm',
          model: 'X-T4',
          price: 200.00,
          description: '2610万像素APS-C画幅无反相机，4K视频录制',
          image_url: 'https://example.com/fujifilm-xt4.jpg',
          status: 'available'
        },
        {
          name: 'Panasonic Lumix S5',
          brand: 'Panasonic',
          model: 'Lumix S5',
          price: 220.00,
          description: '2420万像素全画幅无反相机，4K视频录制',
          image_url: 'https://example.com/panasonic-s5.jpg',
          status: 'available'
        }
      ];
      
      for (const camera of sampleCameras) {
        await connection.execute(
          'INSERT INTO cameras (name, brand, model, price, description, image_url, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [camera.name, camera.brand, camera.model, camera.price, camera.description, camera.image_url, camera.status]
        );
      }
      
      console.log('示例相机数据添加成功！');
    } else {
      console.log(`相机表中有 ${cameras.length} 条数据：`);
      cameras.forEach(camera => {
        console.log(`${camera.id}. ${camera.name} (${camera.brand} ${camera.model}) - ${camera.status}`);
      });
    }
    
    // 检查其他必要的表
    console.log('\n检查其他必要的表...');
    
    // 检查用户表
    const [userTables] = await connection.execute(
      "SHOW TABLES LIKE 'users'"
    );
    
    if (userTables.length === 0) {
      console.log('正在创建用户表...');
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          openid VARCHAR(255) NOT NULL UNIQUE,
          nickname VARCHAR(255),
          avatar VARCHAR(255),
          phone VARCHAR(20),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('用户表创建成功！');
    }
    
    // 检查租赁表
    const [rentalTables] = await connection.execute(
      "SHOW TABLES LIKE 'rentals'"
    );
    
    if (rentalTables.length === 0) {
      console.log('正在创建租赁表...');
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS rentals (
          id INT AUTO_INCREMENT PRIMARY KEY,
          camera_id INT NOT NULL,
          user_name VARCHAR(255) NOT NULL,
          user_phone VARCHAR(20) NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          total_price DECIMAL(10, 2) NOT NULL,
          status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (camera_id) REFERENCES cameras(id) ON DELETE CASCADE
        )
      `);
      console.log('租赁表创建成功！');
    }
    
    // 检查会话表
    const [conversationTables] = await connection.execute(
      "SHOW TABLES LIKE 'conversations'"
    );
    
    if (conversationTables.length === 0) {
      console.log('正在创建会话表...');
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS conversations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT,
          user_name VARCHAR(255),
          user_avatar VARCHAR(255),
          last_message TEXT,
          last_message_time TIMESTAMP,
          status ENUM('active', 'closed') DEFAULT 'active',
          unread_count INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('会话表创建成功！');
    }
    
    // 检查消息表
    const [messageTables] = await connection.execute(
      "SHOW TABLES LIKE 'messages'"
    );
    
    if (messageTables.length === 0) {
      console.log('正在创建消息表...');
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS messages (
          id INT AUTO_INCREMENT PRIMARY KEY,
          conversation_id INT NOT NULL,
          sender_type ENUM('user', 'admin') NOT NULL,
          sender_name VARCHAR(255),
          sender_avatar VARCHAR(255),
          content TEXT NOT NULL,
          message_type ENUM('text', 'image', 'voice') DEFAULT 'text',
          is_read BOOLEAN DEFAULT FALSE,
          read_time TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
        )
      `);
      console.log('消息表创建成功！');
    }
    
    // 检查用户会话表
    const [sessionTables] = await connection.execute(
      "SHOW TABLES LIKE 'user_sessions'"
    );
    
    if (sessionTables.length === 0) {
      console.log('正在创建用户会话表...');
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          session_key VARCHAR(255) NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      console.log('用户会话表创建成功！');
    }
    
    console.log('\n数据库检查和初始化完成！');
    
    connection.release();
  } catch (error) {
    console.error('数据库操作失败：', error);
  }
}

checkDatabase();