const pool = require('./config/database');

// SQL 语句
const createTables = `
-- 会话表
CREATE TABLE IF NOT EXISTS conversations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL COMMENT '用户ID',
  user_name VARCHAR(100) COMMENT '用户昵称',
  user_avatar VARCHAR(255) COMMENT '用户头像',
  last_message TEXT COMMENT '最后一条消息',
  last_message_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '最后消息时间',
  unread_count INT DEFAULT 0 COMMENT '未读消息数',
  status ENUM('active', 'closed') DEFAULT 'active' COMMENT '会话状态',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
);

-- 消息表
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL COMMENT '会话ID',
  sender_type ENUM('user', 'admin') NOT NULL COMMENT '发送者类型',
  sender_name VARCHAR(100) COMMENT '发送者名称',
  sender_avatar VARCHAR(255) COMMENT '发送者头像',
  content TEXT NOT NULL COMMENT '消息内容',
  message_type ENUM('text', 'image', 'file') DEFAULT 'text' COMMENT '消息类型',
  is_read BOOLEAN DEFAULT FALSE COMMENT '是否已读',
  read_time DATETIME COMMENT '已读时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
);

-- 添加外键约束
ALTER TABLE messages ADD FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;

-- 创建索引
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_is_read ON messages(is_read);
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
