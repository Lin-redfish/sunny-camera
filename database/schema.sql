-- 创建数据库
CREATE DATABASE IF NOT EXISTS camera_rental CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE camera_rental;

-- 相机表
CREATE TABLE IF NOT EXISTS cameras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '相机名称',
    brand VARCHAR(50) NOT NULL COMMENT '品牌',
    model VARCHAR(50) NOT NULL COMMENT '型号',
    price DECIMAL(10, 2) NOT NULL COMMENT '租赁价格（元/天）',
    description TEXT COMMENT '描述',
    image_url VARCHAR(255) COMMENT '图片URL',
    status ENUM('available', 'rented', 'maintenance') DEFAULT 'available' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_brand (brand)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='相机表';

-- 租赁记录表
CREATE TABLE IF NOT EXISTS rentals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    camera_id INT NOT NULL,
    user_name VARCHAR(100) NOT NULL COMMENT '租赁人姓名',
    user_phone VARCHAR(20) NOT NULL COMMENT '租赁人电话',
    start_date DATE NOT NULL COMMENT '开始日期',
    end_date DATE NOT NULL COMMENT '结束日期',
    total_price DECIMAL(10, 2) NOT NULL COMMENT '总价',
    status ENUM('active', 'completed', 'cancelled') DEFAULT 'active' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (camera_id) REFERENCES cameras(id) ON DELETE CASCADE,
    INDEX idx_camera_id (camera_id),
    INDEX idx_user_phone (user_phone),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='租赁记录表';

-- 插入示例相机数据
INSERT INTO cameras (name, brand, model, price, description, image_url, status) VALUES
('大疆 Action 6 Pro', 'DJI', 'Action 6 Pro', 150.00, '4K 120fps 运动相机，防水防抖', '/images/dji-action6pro.jpg', 'available'),
('佳能 CCD 相机', 'Canon', 'CCD', 80.00, '复古 CCD 相机，胶片质感', '/images/canon-ccd.jpg', 'available'),
('Nikon Z6 II', 'Nikon', 'Z6 II', 200.00, '2450万像素全画幅无反，双卡槽设计', '/images/nikon-z6ii.jpg', 'available');

-- 管理员表
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码（加密）',
    name VARCHAR(100) COMMENT '管理员姓名',
    avatar VARCHAR(255) COMMENT '头像',
    status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '状态',
    last_online TIMESTAMP NULL COMMENT '最后在线时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员表';

-- 会话表
CREATE TABLE IF NOT EXISTS conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL COMMENT '用户ID（微信openid）',
    user_name VARCHAR(100) COMMENT '用户昵称',
    user_avatar VARCHAR(255) COMMENT '用户头像',
    last_message TEXT COMMENT '最后一条消息',
    last_message_time TIMESTAMP NULL COMMENT '最后消息时间',
    unread_count INT DEFAULT 0 COMMENT '未读消息数',
    status ENUM('active', 'closed') DEFAULT 'active' COMMENT '会话状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='会话表';

-- 消息表
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL COMMENT '会话ID',
    sender_type ENUM('user', 'admin') NOT NULL COMMENT '发送者类型',
    sender_name VARCHAR(100) COMMENT '发送者昵称',
    sender_avatar VARCHAR(255) COMMENT '发送者头像',
    content TEXT NOT NULL COMMENT '消息内容',
    message_type ENUM('text', 'image', 'system') DEFAULT 'text' COMMENT '消息类型',
    is_read BOOLEAN DEFAULT FALSE COMMENT '是否已读',
    read_time TIMESTAMP NULL COMMENT '已读时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    INDEX idx_conversation_id (conversation_id),
    INDEX idx_created_at (created_at),
    INDEX idx_is_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='消息表';

-- 插入默认管理员数据（密码：admin123）
INSERT INTO admins (username, password, name, status) VALUES
('admin', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '管理员', 'active');