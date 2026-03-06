# 相机预约小程序 - 交流功能实现方案

## 一、功能设计方案

### 1.1 交流功能类型选择

根据相机租赁业务场景，推荐以下交流功能：

#### 方案A：评论/留言系统（推荐 ⭐⭐⭐⭐⭐）
- **适用场景**：用户对相机进行评价、提问、分享使用心得
- **优点**：实现简单、用户体验好、便于管理
- **功能点**：
  - 相机评论（针对具体相机）
  - 用户问答
  - 评分系统
  - 回复功能
  - 点赞功能

#### 方案B：聊天/即时通讯
- **适用场景**：用户与客服实时沟通
- **优点**：即时性强
- **缺点**：实现复杂、需要WebSocket支持
- **功能点**：
  - 用户与客服聊天
  - 消息推送
  - 聊天记录

#### 方案C：社区/论坛
- **适用场景**：摄影技巧交流、作品分享
- **优点**：用户粘性高
- **缺点**：开发工作量大
- **功能点**：
  - 帖子发布
  - 话题讨论
  - 用户关注

---

## 二、推荐方案：评论/留言系统

### 2.1 功能模块

#### 2.1.1 相机评论模块
- 查看相机评论列表
- 发表评论
- 回复评论
- 点赞评论
- 删除自己的评论

#### 2.1.2 用户问答模块
- 提问列表
- 回答问题
- 采纳最佳答案

#### 2.1.3 评分系统
- 1-5星评分
- 评分统计
- 评分详情

---

## 三、数据库设计

### 3.1 新增数据表

#### 3.1.1 评论表（comments）
```sql
CREATE TABLE IF NOT EXISTS comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    camera_id INT NOT NULL COMMENT '相机ID',
    user_name VARCHAR(100) NOT NULL COMMENT '用户昵称',
    user_avatar VARCHAR(255) COMMENT '用户头像',
    content TEXT NOT NULL COMMENT '评论内容',
    rating TINYINT COMMENT '评分（1-5）',
    parent_id INT DEFAULT 0 COMMENT '父评论ID（0为一级评论）',
    reply_to_user VARCHAR(100) COMMENT '回复的用户昵称',
    likes INT DEFAULT 0 COMMENT '点赞数',
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (camera_id) REFERENCES cameras(id) ON DELETE CASCADE,
    INDEX idx_camera_id (camera_id),
    INDEX idx_parent_id (parent_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评论表';
```

#### 3.1.2 问答表（questions）
```sql
CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    camera_id INT NOT NULL COMMENT '相机ID',
    user_name VARCHAR(100) NOT NULL COMMENT '用户昵称',
    user_avatar VARCHAR(255) COMMENT '用户头像',
    title VARCHAR(200) NOT NULL COMMENT '问题标题',
    content TEXT NOT NULL COMMENT '问题内容',
    views INT DEFAULT 0 COMMENT '浏览量',
    answers INT DEFAULT 0 COMMENT '回答数',
    status ENUM('open', 'closed', 'resolved') DEFAULT 'open' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (camera_id) REFERENCES cameras(id) ON DELETE CASCADE,
    INDEX idx_camera_id (camera_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='问答表';
```

#### 3.1.3 回答表（answers）
```sql
CREATE TABLE IF NOT EXISTS answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL COMMENT '问题ID',
    user_name VARCHAR(100) NOT NULL COMMENT '用户昵称',
    user_avatar VARCHAR(255) COMMENT '用户头像',
    content TEXT NOT NULL COMMENT '回答内容',
    likes INT DEFAULT 0 COMMENT '点赞数',
    is_accepted BOOLEAN DEFAULT FALSE COMMENT '是否被采纳',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    INDEX idx_question_id (question_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='回答表';
```

---

## 四、后端API设计

### 4.1 评论相关API

#### 4.1.1 获取相机评论列表
```
GET /api/comments
参数：
- cameraId: 相机ID（必填）
- page: 页码（可选，默认1）
- limit: 每页数量（可选，默认10）

返回：
{
  "success": true,
  "data": {
    "comments": [...],
    "total": 100,
    "page": 1,
    "limit": 10
  }
}
```

#### 4.1.2 发表评论
```
POST /api/comments
参数：
{
  "cameraId": 1,
  "userName": "张三",
  "userAvatar": "头像URL",
  "content": "评论内容",
  "rating": 5,
  "parentId": 0,
  "replyToUser": ""
}

返回：
{
  "success": true,
  "message": "评论成功",
  "data": {
    "commentId": 123
  }
}
```

#### 4.1.3 点赞评论
```
POST /api/comments/:id/like
返回：
{
  "success": true,
  "message": "点赞成功",
  "data": {
    "likes": 10
  }
}
```

#### 4.1.4 删除评论
```
DELETE /api/comments/:id
返回：
{
  "success": true,
  "message": "删除成功"
}
```

### 4.2 问答相关API

#### 4.2.1 获取问题列表
```
GET /api/questions
参数：
- cameraId: 相机ID（可选）
- status: 状态（可选）
- page: 页码（可选）
- limit: 每页数量（可选）
```

#### 4.2.2 发布问题
```
POST /api/questions
参数：
{
  "cameraId": 1,
  "userName": "张三",
  "title": "问题标题",
  "content": "问题内容"
}
```

#### 4.2.3 获取问题详情
```
GET /api/questions/:id
```

#### 4.2.4 回答问题
```
POST /api/questions/:id/answers
参数：
{
  "userName": "张三",
  "content": "回答内容"
}
```

#### 4.2.5 采纳最佳答案
```
POST /api/answers/:id/accept
```

---

## 五、前端页面设计

### 5.1 新增页面结构

```
pages/
├── comments/              # 评论相关页面
│   ├── comments.js       # 评论列表
│   ├── comments.wxml     # 评论列表UI
│   ├── comments.wxss     # 评论列表样式
│   └── comments.json     # 评论列表配置
├── questions/             # 问答相关页面
│   ├── questions.js      # 问题列表
│   ├── questions.wxml    # 问题列表UI
│   ├── questions.wxss    # 问题列表样式
│   └── questions.json    # 问题列表配置
└── question-detail/      # 问题详情
    ├── question-detail.js
    ├── question-detail.wxml
    ├── question-detail.wxss
    └── question-detail.json
```

### 5.2 在相机详情页添加入口

修改 [pages/index/index.wxml](file:///d:\相机租赁\pages\index\index.wxml)：

```xml
<!-- 在相机卡片中添加评论和问答入口 -->
<view class="camera-actions">
  <button class="action-btn" bindtap="showComments">评论 ({{commentCount}})</button>
  <button class="action-btn" bindtap="showQuestions">问答 ({{questionCount}})</button>
</view>
```

### 5.3 评论页面UI设计

#### 5.3.1 评论列表页面
- 顶部：相机信息（名称、图片）
- 中间：评论列表
  - 一级评论：头像、昵称、评分、内容、时间、点赞数
  - 二级评论：缩进显示、回复标识
- 底部：输入框 + 发送按钮

#### 5.3.2 问答列表页面
- 顶部：筛选按钮（全部、我的、待解决）
- 中间：问题卡片
  - 标题
  - 摘要
  - 回答数、浏览数
  - 状态标签
- 底部：提问按钮

#### 5.3.3 问题详情页面
- 顶部：问题详情
  - 标题
  - 内容
  - 提问者信息
- 中间：回答列表
  - 回答者信息
  - 回答内容
  - 点赞数
  - 采纳标识
- 底部：回答输入框

---

## 六、实现步骤

### 6.1 第一步：数据库准备
1. 创建评论表（comments）
2. 创建问答表（questions）
3. 创建回答表（answers）
4. 插入测试数据

### 6.2 第二步：后端API开发
1. 创建评论路由文件（backend/routes/comments.js）
2. 创建问答路由文件（backend/routes/questions.js）
3. 在server.js中注册路由
4. 测试API接口

### 6.3 第三步：前端页面开发
1. 创建评论页面（pages/comments）
2. 创建问答页面（pages/questions）
3. 创建问题详情页面（pages/question-detail）
4. 在app.json中注册新页面

### 6.4 第四步：功能集成
1. 在相机详情页添加评论和问答入口
2. 实现页面跳转逻辑
3. 实现数据加载和展示
4. 实现用户交互功能

### 6.5 第五步：测试和优化
1. 功能测试
2. 性能优化
3. 用户体验优化

---

## 七、技术要点

### 7.1 前端技术
- 使用wx.request调用后端API
- 使用scroll-view实现滚动加载
- 使用textarea实现多行输入
- 使用wx.showToast提示用户

### 7.2 后端技术
- 使用MySQL存储评论和问答数据
- 使用事务保证数据一致性
- 使用分页查询提高性能
- 使用索引优化查询速度

### 7.3 数据验证
- 前端：输入验证（长度、格式）
- 后端：参数验证、SQL注入防护
- 数据库：外键约束、字段类型限制

---

## 八、扩展功能

### 8.1 评论管理后台
- 评论审核
- 评论删除
- 评论统计

### 8.2 消息通知
- 评论回复通知
- 问题回答通知
- 采纳答案通知

### 8.3 用户系统
- 用户登录
- 用户中心
- 我的评论
- 我的问题

### 8.4 图片上传
- 评论图片
- 问题图片
- 回答图片

---

## 九、注意事项

### 9.1 安全性
- 防止SQL注入
- 防止XSS攻击
- 用户输入过滤
- 敏感信息加密

### 9.2 性能优化
- 分页加载
- 图片懒加载
- 缓存策略
- 数据库索引

### 9.3 用户体验
- 加载状态提示
- 错误提示
- 操作反馈
- 空状态处理

---

## 十、快速开始

### 10.1 创建数据库表
```bash
mysql -u root -p < database/comments_schema.sql
```

### 10.2 创建后端路由
```bash
# 创建评论路由
touch backend/routes/comments.js

# 创建问答路由
touch backend/routes/questions.js
```

### 10.3 创建前端页面
```bash
# 创建评论页面
mkdir -p pages/comments
touch pages/comments/{comments.js,comments.wxml,comments.wxss,comments.json}

# 创建问答页面
mkdir -p pages/questions
touch pages/questions/{questions.js,questions.wxml,questions.wxss,questions.json}

# 创建问题详情页面
mkdir -p pages/question-detail
touch pages/question-detail/{question-detail.js,question-detail.wxml,question-detail.wxss,question-detail.json}
```

---

## 总结

推荐使用**评论/留言系统**作为交流功能，原因：
1. 实现相对简单
2. 用户体验好
3. 适合相机租赁业务场景
4. 便于后续扩展

按照本方案实施，可以快速搭建一个功能完善的交流系统，提升用户互动和产品体验。
