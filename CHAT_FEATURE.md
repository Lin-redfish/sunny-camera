# 相机预约小程序 - 聊天/即时通讯功能实现方案

## 一、功能需求分析

### 1.1 业务场景
- 用户在预约相机时，可能需要咨询相关问题
- 管理者需要及时回复用户的咨询
- 需要实时消息推送
- 需要消息历史记录

### 1.2 功能需求
- 用户可以发起与客服的对话
- 用户可以发送文字消息
- 用户可以查看消息历史
- 管理者可以接收用户消息
- 管理者可以回复用户消息
- 实时消息提醒

---

## 二、技术方案选择

### 2.1 方案对比

#### 方案A：WebSocket（推荐 ⭐⭐⭐⭐⭐）
**优点**：
- 实时性好，消息推送及时
- 双向通信，用户体验好
- 服务器主动推送消息

**缺点**：
- 实现相对复杂
- 需要保持长连接

**适用场景**：需要实时性强的聊天功能

#### 方案B：HTTP轮询
**优点**：
- 实现简单
- 兼容性好

**缺点**：
- 实时性差
- 服务器压力大

**适用场景**：对实时性要求不高的场景

#### 方案C：使用第三方服务（如腾讯云IM）
**优点**：
- 功能完善
- 稳定可靠

**缺点**：
- 需要付费
- 有一定学习成本

**适用场景**：快速上线、预算充足

### 2.2 推荐方案：WebSocket

基于你的需求，推荐使用**WebSocket**方案：
- 实时性好，用户体验佳
- 可以自己控制，成本低
- 适合1对1客服聊天场景

---

## 三、数据库设计

### 3.1 数据表结构

#### 3.1.1 会话表（conversations）
```sql
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
```

#### 3.1.2 消息表（messages）
```sql
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
```

#### 3.1.3 管理员表（admins）
```sql
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
```

---

## 四、后端实现

### 4.1 技术栈
- Node.js + Express
- Socket.IO（WebSocket库）
- MySQL

### 4.2 安装依赖
```bash
cd backend
npm install socket.io
```

### 4.3 WebSocket服务器实现

#### 4.3.1 创建WebSocket服务器
创建文件：`backend/socket.js`

```javascript
const { Server } = require('socket.io');
const pool = require('./config/database');

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('客户端连接:', socket.id);

    // 用户连接
    socket.on('user:connect', async (data) => {
      const { userId, userName, userAvatar } = data;
      socket.userId = userId;
      socket.userType = 'user';
      
      // 更新用户在线状态
      await updateOnlineStatus(userId, 'online');
      
      // 通知管理员用户上线
      io.emit('user:online', { userId, userName });
      
      console.log('用户上线:', userId, userName);
    });

    // 管理员连接
    socket.on('admin:connect', async (data) => {
      const { adminId, adminName } = data;
      socket.adminId = adminId;
      socket.userType = 'admin';
      
      console.log('管理员上线:', adminId, adminName);
    });

    // 发送消息
    socket.on('message:send', async (data) => {
      try {
        const { conversationId, senderType, senderName, senderAvatar, content, messageType } = data;
        
        // 保存消息到数据库
        const [result] = await pool.execute(
          `INSERT INTO messages (conversation_id, sender_type, sender_name, sender_avatar, content, message_type)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [conversationId, senderType, senderName, senderAvatar, content, messageType || 'text']
        );

        const messageId = result.insertId;

        // 更新会话的最后消息
        await pool.execute(
          `UPDATE conversations 
           SET last_message = ?, last_message_time = NOW(), unread_count = unread_count + 1
           WHERE id = ?`,
          [content, conversationId]
        );

        // 获取会话信息
        const [conversations] = await pool.execute(
          'SELECT * FROM conversations WHERE id = ?',
          [conversationId]
        );

        const conversation = conversations[0];

        // 构造消息对象
        const message = {
          id: messageId,
          conversationId,
          senderType,
          senderName,
          senderAvatar,
          content,
          messageType: messageType || 'text',
          isRead: false,
          createdAt: new Date()
        };

        // 发送给管理员
        io.emit('message:receive', message);

        // 如果是管理员发送，发送给对应用户
        if (senderType === 'admin') {
          io.emit(`user:${conversation.user_id}:message`, message);
        }

        console.log('消息发送成功:', message);
      } catch (error) {
        console.error('发送消息失败:', error);
        socket.emit('message:error', { error: error.message });
      }
    });

    // 标记消息已读
    socket.on('message:read', async (data) => {
      try {
        const { conversationId } = data;
        
        await pool.execute(
          `UPDATE messages 
           SET is_read = TRUE, read_time = NOW()
           WHERE conversation_id = ? AND sender_type = 'user' AND is_read = FALSE`,
          [conversationId]
        );

        // 重置未读数
        await pool.execute(
          `UPDATE conversations 
           SET unread_count = 0
           WHERE id = ?`,
          [conversationId]
        );

        console.log('消息已标记为已读:', conversationId);
      } catch (error) {
        console.error('标记消息已读失败:', error);
      }
    });

    // 断开连接
    socket.on('disconnect', async () => {
      if (socket.userId) {
        await updateOnlineStatus(socket.userId, 'offline');
        io.emit('user:offline', { userId: socket.userId });
        console.log('用户下线:', socket.userId);
      }
      if (socket.adminId) {
        console.log('管理员下线:', socket.adminId);
      }
    });
  });

  return io;
}

async function updateOnlineStatus(userId, status) {
  try {
    await pool.execute(
      `UPDATE conversations 
       SET updated_at = NOW()
       WHERE user_id = ?`,
      [userId]
    );
  } catch (error) {
    console.error('更新在线状态失败:', error);
  }
}

module.exports = { initSocket, getIO: () => io };
```

#### 4.3.2 修改server.js集成WebSocket
```javascript
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const path = require('path');
require('dotenv').config();

const apiRoutes = require('./routes/api');
const { initSocket } = require('./socket');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// 初始化WebSocket
initSocket(server);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..')));

app.use('/api', apiRoutes);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`WebSocket服务已启动`);
});
```

### 4.4 REST API实现

#### 4.4.1 创建聊天路由
创建文件：`backend/routes/chat.js`

```javascript
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// 获取或创建会话
router.post('/conversations', async (req, res) => {
  try {
    const { userId, userName, userAvatar } = req.body;

    // 查找是否存在会话
    const [existing] = await pool.execute(
      'SELECT * FROM conversations WHERE user_id = ? AND status = ?',
      [userId, 'active']
    );

    if (existing.length > 0) {
      return res.json({
        success: true,
        data: existing[0]
      });
    }

    // 创建新会话
    const [result] = await pool.execute(
      `INSERT INTO conversations (user_id, user_name, user_avatar, status)
       VALUES (?, ?, ?, ?)`,
      [userId, userName, userAvatar, 'active']
    );

    const [conversation] = await pool.execute(
      'SELECT * FROM conversations WHERE id = ?',
      [result.insertId]
    );

    res.json({
      success: true,
      data: conversation[0]
    });
  } catch (error) {
    console.error('创建会话失败:', error);
    res.status(500).json({
      success: false,
      message: '创建会话失败',
      error: error.message
    });
  }
});

// 获取会话列表（管理员）
router.get('/conversations', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM conversations 
       WHERE status = ? 
       ORDER BY updated_at DESC`,
      ['active']
    );

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

// 获取会话详情
router.get('/conversations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      'SELECT * FROM conversations WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '会话不存在'
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('获取会话详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取会话详情失败',
      error: error.message
    });
  }
});

// 获取消息列表
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const [rows] = await pool.execute(
      `SELECT * FROM messages 
       WHERE conversation_id = ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [id, parseInt(limit), offset]
    );

    // 获取总数
    const [count] = await pool.execute(
      'SELECT COUNT(*) as total FROM messages WHERE conversation_id = ?',
      [id]
    );

    res.json({
      success: true,
      data: {
        messages: rows.reverse(),
        total: count[0].total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
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

module.exports = router;
```

#### 4.4.2 在server.js中注册路由
```javascript
const chatRoutes = require('./routes/chat');
app.use('/api/chat', chatRoutes);
```

---

## 五、前端实现

### 5.1 小程序端

#### 5.1.1 安装Socket.IO客户端
```bash
npm install socket.io-client
```

#### 5.1.2 创建聊天页面
创建文件：`pages/chat/chat.js`

```javascript
const io = require('../../utils/socket.io-client');

Page({
  data: {
    userId: '',
    userName: '',
    userAvatar: '',
    conversationId: 0,
    messages: [],
    inputContent: '',
    socket: null,
    isConnected: false
  },

  onLoad(options) {
    // 获取用户信息（从缓存或登录获取）
    const userInfo = wx.getStorageSync('userInfo') || {};
    this.setData({
      userId: userInfo.openid || 'user_' + Date.now(),
      userName: userInfo.nickName || '用户',
      userAvatar: userInfo.avatarUrl || ''
    });

    this.initSocket();
    this.getOrCreateConversation();
  },

  onUnload() {
    if (this.data.socket) {
      this.data.socket.disconnect();
    }
  },

  // 初始化WebSocket连接
  initSocket() {
    const socket = io('https://online-formats-defense-telecom.trycloudflare.com', {
      transports: ['websocket'],
      reconnection: true
    });

    socket.on('connect', () => {
      console.log('WebSocket连接成功');
      this.setData({ isConnected: true });

      // 发送用户连接信息
      socket.emit('user:connect', {
        userId: this.data.userId,
        userName: this.data.userName,
        userAvatar: this.data.userAvatar
      });
    });

    socket.on('disconnect', () => {
      console.log('WebSocket断开连接');
      this.setData({ isConnected: false });
    });

    // 接收消息
    socket.on('message:receive', (message) => {
      if (message.conversationId === this.data.conversationId) {
        this.setData({
          messages: [...this.data.messages, message]
        });
        this.scrollToBottom();
      }
    });

    // 消息发送错误
    socket.on('message:error', (data) => {
      wx.showToast({
        title: '发送失败',
        icon: 'none'
      });
    });

    this.setData({ socket });
  },

  // 获取或创建会话
  async getOrCreateConversation() {
    try {
      const res = await wx.request({
        url: 'https://online-formats-defense-telecom.trycloudflare.com/api/chat/conversations',
        method: 'POST',
        data: {
          userId: this.data.userId,
          userName: this.data.userName,
          userAvatar: this.data.userAvatar
        }
      });

      if (res.data.success) {
        this.setData({ conversationId: res.data.data.id });
        this.loadMessages();
      }
    } catch (error) {
      console.error('获取会话失败:', error);
    }
  },

  // 加载消息历史
  async loadMessages() {
    try {
      const res = await wx.request({
        url: `https://online-formats-defense-telecom.trycloudflare.com/api/chat/conversations/${this.data.conversationId}/messages`,
        method: 'GET'
      });

      if (res.data.success) {
        this.setData({ messages: res.data.data.messages });
        this.scrollToBottom();
      }
    } catch (error) {
      console.error('加载消息失败:', error);
    }
  },

  // 输入内容变化
  onInputChange(e) {
    this.setData({
      inputContent: e.detail.value
    });
  },

  // 发送消息
  sendMessage() {
    const { inputContent, conversationId, socket, userName, userAvatar } = this.data;

    if (!inputContent.trim()) {
      wx.showToast({
        title: '请输入消息',
        icon: 'none'
      });
      return;
    }

    if (!socket || !this.data.isConnected) {
      wx.showToast({
        title: '连接中...',
        icon: 'none'
      });
      return;
    }

    // 通过WebSocket发送消息
    socket.emit('message:send', {
      conversationId,
      senderType: 'user',
      senderName: userName,
      senderAvatar: userAvatar,
      content: inputContent,
      messageType: 'text'
    });

    // 清空输入框
    this.setData({ inputContent: '' });
  },

  // 滚动到底部
  scrollToBottom() {
    wx.createSelectorQuery()
      .select('#message-list')
      .boundingClientRect((rect) => {
        wx.pageScrollTo({
          scrollTop: rect.bottom,
          duration: 300
        });
      })
      .exec();
  }
});
```

#### 5.1.3 创建聊天页面UI
创建文件：`pages/chat/chat.wxml`

```xml
<view class="chat-container">
  <!-- 消息列表 -->
  <scroll-view 
    id="message-list"
    class="message-list" 
    scroll-y 
    scroll-into-view="{{scrollToView}}"
    scroll-with-animation>
    
    <view 
      wx:for="{{messages}}" 
      wx:key="id" 
      class="message-item {{item.senderType === 'user' ? 'message-right' : 'message-left'}}">
      
      <!-- 对方消息 -->
      <block wx:if="{{item.senderType === 'admin'}}">
        <image class="avatar" src="{{item.senderAvatar || '/images/admin-avatar.png'}}"></image>
        <view class="message-content">
          <text class="sender-name">{{item.senderName}}</text>
          <text class="message-text">{{item.content}}</text>
        </view>
      </block>

      <!-- 我的消息 -->
      <block wx:else>
        <view class="message-content">
          <text class="message-text">{{item.content}}</text>
        </view>
        <image class="avatar" src="{{item.senderAvatar || '/images/user-avatar.png'}}"></image>
      </block>
    </view>
  </scroll-view>

  <!-- 输入框 -->
  <view class="input-bar">
    <input 
      class="input-field" 
      placeholder="输入消息..." 
      value="{{inputContent}}" 
      bindinput="onInputChange" />
    <button class="send-btn" bindtap="sendMessage" disabled="{{!isConnected}}">
      {{isConnected ? '发送' : '连接中'}}
    </button>
  </view>
</view>
```

#### 5.1.4 创建聊天页面样式
创建文件：`pages/chat/chat.wxss`

```css
.chat-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.message-list {
  flex: 1;
  padding: 20rpx;
  overflow-y: auto;
}

.message-item {
  display: flex;
  margin-bottom: 30rpx;
  align-items: flex-start;
}

.message-left {
  flex-direction: row;
}

.message-right {
  flex-direction: row-reverse;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background-color: #ddd;
}

.message-content {
  max-width: 70%;
  margin: 0 20rpx;
}

.sender-name {
  display: block;
  font-size: 24rpx;
  color: #999;
  margin-bottom: 10rpx;
}

.message-text {
  display: inline-block;
  padding: 20rpx 30rpx;
  background-color: #fff;
  border-radius: 10rpx;
  font-size: 28rpx;
  line-height: 1.5;
  word-wrap: break-word;
}

.message-left .message-text {
  background-color: #fff;
}

.message-right .message-text {
  background-color: #07c160;
  color: #fff;
}

.input-bar {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background-color: #fff;
  border-top: 1rpx solid #eee;
}

.input-field {
  flex: 1;
  height: 80rpx;
  padding: 0 20rpx;
  background-color: #f5f5f5;
  border-radius: 40rpx;
  font-size: 28rpx;
}

.send-btn {
  margin-left: 20rpx;
  width: 120rpx;
  height: 80rpx;
  line-height: 80rpx;
  padding: 0;
  background-color: #07c160;
  color: #fff;
  font-size: 28rpx;
}

.send-btn[disabled] {
  background-color: #ccc;
}
```

#### 5.1.5 注册聊天页面
在 `app.json` 中添加：

```json
{
  "pages": [
    "pages/index/index",
    "pages/chat/chat"
  ]
}
```

#### 5.1.6 在相机详情页添加客服入口
在 `pages/index/index.wxml` 中添加：

```xml
<view class="service-btn" bindtap="openChat">
  <text>💬 联系客服</text>
</view>
```

在 `pages/index/index.js` 中添加：

```javascript
openChat() {
  wx.navigateTo({
    url: '/pages/chat/chat'
  });
}
```

### 5.2 管理端（Web）

#### 5.2.1 创建管理端页面
创建文件：`admin.html`

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>客服管理系统</title>
    <script src="https://cdn.socket.io/4.0.0/socket.io.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
        }
        .container {
            display: flex;
            height: 100vh;
        }
        .sidebar {
            width: 300px;
            background-color: #fff;
            border-right: 1px solid #ddd;
            overflow-y: auto;
        }
        .chat-area {
            flex: 1;
            display: flex;
            flex-direction: column;
            background-color: #fff;
        }
        .conversation-item {
            padding: 20px;
            border-bottom: 1px solid #eee;
            cursor: pointer;
        }
        .conversation-item:hover {
            background-color: #f9f9f9;
        }
        .conversation-item.active {
            background-color: #e6f7ff;
        }
        .user-name {
            font-weight: bold;
            margin-bottom: 5px;
        }
        .last-message {
            color: #666;
            font-size: 14px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .unread-badge {
            display: inline-block;
            background-color: #ff4d4f;
            color: #fff;
            border-radius: 50%;
            padding: 2px 8px;
            font-size: 12px;
            margin-left: 5px;
        }
        .message-list {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            background-color: #f5f5f5;
        }
        .message-item {
            margin-bottom: 20px;
            display: flex;
        }
        .message-item.user {
            justify-content: flex-start;
        }
        .message-item.admin {
            justify-content: flex-end;
        }
        .message-content {
            max-width: 70%;
            padding: 10px 15px;
            border-radius: 10px;
            background-color: #fff;
        }
        .message-item.user .message-content {
            background-color: #fff;
        }
        .message-item.admin .message-content {
            background-color: #1890ff;
            color: #fff;
        }
        .input-area {
            padding: 20px;
            border-top: 1px solid #ddd;
            display: flex;
        }
        .input-area input {
            flex: 1;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            margin-right: 10px;
        }
        .input-area button {
            padding: 10px 20px;
            background-color: #1890ff;
            color: #fff;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }
        .empty-state {
            text-align: center;
            padding: 50px;
            color: #999;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="sidebar">
            <h2 style="padding: 20px;">会话列表</h2>
            <div id="conversation-list"></div>
        </div>
        <div class="chat-area">
            <div id="message-list" class="message-list">
                <div class="empty-state">选择一个会话开始聊天</div>
            </div>
            <div class="input-area" id="input-area" style="display: none;">
                <input type="text" id="message-input" placeholder="输入消息...">
                <button onclick="sendMessage()">发送</button>
            </div>
        </div>
    </div>

    <script>
        const socket = io('https://online-formats-defense-telecom.trycloudflare.com');
        let currentConversation = null;
        let conversations = [];

        // 管理员连接
        socket.emit('admin:connect', {
            adminId: 'admin_1',
            adminName: '客服'
        });

        // 接收消息
        socket.on('message:receive', (message) => {
            if (currentConversation && message.conversationId === currentConversation.id) {
                addMessage(message);
            }
            loadConversations();
        });

        // 用户上线
        socket.on('user:online', (data) => {
            console.log('用户上线:', data);
        });

        // 用户下线
        socket.on('user:offline', (data) => {
            console.log('用户下线:', data);
        });

        // 加载会话列表
        async function loadConversations() {
            try {
                const response = await fetch('https://online-formats-defense-telecom.trycloudflare.com/api/chat/conversations');
                const data = await response.json();
                
                if (data.success) {
                    conversations = data.data;
                    renderConversations();
                }
            } catch (error) {
                console.error('加载会话列表失败:', error);
            }
        }

        // 渲染会话列表
        function renderConversations() {
            const listElement = document.getElementById('conversation-list');
            listElement.innerHTML = conversations.map(conv => `
                <div class="conversation-item ${currentConversation && currentConversation.id === conv.id ? 'active' : ''}" 
                     onclick="selectConversation(${conv.id})">
                    <div class="user-name">${conv.user_name}</div>
                    <div class="last-message">
                        ${conv.last_message || '暂无消息'}
                        ${conv.unread_count > 0 ? `<span class="unread-badge">${conv.unread_count}</span>` : ''}
                    </div>
                </div>
            `).join('');
        }

        // 选择会话
        async function selectConversation(conversationId) {
            currentConversation = conversations.find(c => c.id === conversationId);
            renderConversations();
            
            try {
                const response = await fetch(`https://online-formats-defense-telecom.trycloudflare.com/api/chat/conversations/${conversationId}/messages`);
                const data = await response.json();
                
                if (data.success) {
                    document.getElementById('message-list').innerHTML = '';
                    data.data.messages.forEach(msg => addMessage(msg));
                    document.getElementById('input-area').style.display = 'flex';
                }
            } catch (error) {
                console.error('加载消息失败:', error);
            }
        }

        // 添加消息
        function addMessage(message) {
            const messageList = document.getElementById('message-list');
            const messageElement = document.createElement('div');
            messageElement.className = `message-item ${message.senderType}`;
            messageElement.innerHTML = `
                <div class="message-content">
                    <div>${message.senderName}</div>
                    <div>${message.content}</div>
                </div>
            `;
            messageList.appendChild(messageElement);
            messageList.scrollTop = messageList.scrollHeight;
        }

        // 发送消息
        function sendMessage() {
            const input = document.getElementById('message-input');
            const content = input.value.trim();
            
            if (!content || !currentConversation) return;

            socket.emit('message:send', {
                conversationId: currentConversation.id,
                senderType: 'admin',
                senderName: '客服',
                senderAvatar: '',
                content: content,
                messageType: 'text'
            });

            input.value = '';
        }

        // 回车发送
        document.getElementById('message-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });

        // 初始加载
        loadConversations();
        
        // 定时刷新会话列表
        setInterval(loadConversations, 5000);
    </script>
</body>
</html>
```

---

## 六、实现步骤

### 第一步：数据库准备
```bash
mysql -u root -p < database/chat_schema.sql
```

### 第二步：安装依赖
```bash
cd backend
npm install socket.io
```

### 第三步：创建后端文件
1. 创建 `backend/socket.js`
2. 创建 `backend/routes/chat.js`
3. 修改 `backend/server.js`

### 第四步：创建前端页面
1. 创建小程序聊天页面
2. 创建管理端页面

### 第五步：测试功能
1. 启动后端服务
2. 测试小程序聊天功能
3. 测试管理端功能

---

## 七、注意事项

### 7.1 安全性
- 消息内容过滤
- 防止SQL注入
- 用户身份验证
- 管理员权限控制

### 7.2 性能优化
- 消息分页加载
- 图片压缩
- 连接池管理
- 缓存策略

### 7.3 用户体验
- 连接状态提示
- 消息发送状态
- 消息已读状态
- 未读消息提醒

---

## 八、扩展功能

### 8.1 消息类型
- 文字消息
- 图片消息
- 语音消息
- 文件消息

### 8.2 消息管理
- 消息撤回
- 消息转发
- 消息收藏
- 消息搜索

### 8.3 客服功能
- 自动回复
- 快捷回复
- 常见问题
- 转接客服

### 8.4 统计分析
- 对话统计
- 响应时间
- 满意度调查
- 数据报表

---

## 总结

本方案提供了一个完整的用户与管理者1对1聊天功能实现方案，使用WebSocket实现实时通信，适合相机租赁业务场景。按照本方案实施，可以快速搭建一个功能完善的客服聊天系统。
