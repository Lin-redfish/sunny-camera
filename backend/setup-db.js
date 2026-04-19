const pool = require('./config/database');

// SQL 语句
const createTables = `
-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    openid VARCHAR(100) NOT NULL UNIQUE COMMENT '微信openid',
    nickname VARCHAR(100) COMMENT '用户昵称',
    avatar VARCHAR(255) COMMENT '用户头像',
    phone VARCHAR(20) COMMENT '用户电话',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_openid (openid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 用户会话表
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_key VARCHAR(100) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_session_key (session_key),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户会话表';

-- 评价表
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rental_id INT NOT NULL,
    star INT NOT NULL COMMENT '评分（1-5）',
    content TEXT NOT NULL COMMENT '评价内容',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rental_id) REFERENCES rentals(id) ON DELETE CASCADE,
    INDEX idx_rental_id (rental_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评价表';
`;

// 执行 SQL 语句
async function setupDatabase() {
  try {
    console.log('正在创建数据库表...');
    
    // 分割 SQL 语句并执行
    const statements = createTables.split(';').filter(stmt => stmt.trim() !== '');
    
    for (const statement of statements) {
      await pool.execute(statement);
      console.log('执行语句成功:', statement.substring(0, 50) + '...');
    }
    
    console.log('数据库表创建成功！');
    
    // 关闭连接池
    await pool.end();
    
  } catch (error) {
    console.error('创建数据库表失败:', error);
    
    // 关闭连接池
    await pool.end();
    
    process.exit(1);
  }
}

// 执行设置
setupDatabase();
