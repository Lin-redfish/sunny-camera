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
('Canon EOS R5', 'Canon', 'EOS R5', 300.00, '4500万像素全画幅无反相机，8K视频录制', 'https://example.com/canon-r5.jpg', 'available'),
('Sony A7 IV', 'Sony', 'A7 IV', 250.00, '3300万像素全画幅微单，4K 60fps视频', 'https://example.com/sony-a7iv.jpg', 'available'),
('Nikon Z6 II', 'Nikon', 'Z6 II', 200.00, '2450万像素全画幅无反，双卡槽设计', 'https://example.com/nikon-z6ii.jpg', 'available'),
('Fujifilm X-T4', 'Fujifilm', 'X-T4', 180.00, '2610万像素APS-C画幅，五轴防抖', 'https://example.com/fuji-xt4.jpg', 'available'),
('Panasonic S5', 'Panasonic', 'S5', 220.00, '2400万像素全画幅，6K视频录制', 'https://example.com/panasonic-s5.jpg', 'available'),
('Canon EOS R6', 'Canon', 'EOS R6', 280.00, '2000万像素全画幅，高速连拍', 'https://example.com/canon-r6.jpg', 'available'),
('Sony A7 III', 'Sony', 'A7 III', 200.00, '2420万像素全画幅，高性价比选择', 'https://example.com/sony-a7iii.jpg', 'available'),
('Nikon Z7 II', 'Nikon', 'Z7 II', 350.00, '4570万像素全画幅，专业级画质', 'https://example.com/nikon-z7ii.jpg', 'available');