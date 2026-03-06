const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const apiRoutes = require('./routes/api');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../miniprogram')));

app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.json({
    message: '相机预约API服务',
    version: '1.0.0',
    endpoints: {
      cameras: 'GET /api/cameras - 获取相机列表',
      cameraDetail: 'GET /api/cameras/:id - 获取相机详情',
      rent: 'POST /api/rent - 预约相机',
      return: 'POST /api/return - 归还相机',
      rentals: 'GET /api/rentals - 获取预约记录'
    }
  });
});

// WebSocket 处理
const users = new Map();
const admins = new Map();

io.on('connection', (socket) => {
  console.log('新的WebSocket连接:', socket.id);

  // 用户连接
  socket.on('user:connect', (data) => {
    users.set(socket.id, {
      userId: data.userId,
      userName: data.userName,
      userAvatar: data.userAvatar,
      socketId: socket.id
    });
    console.log('用户连接:', data.userName, '(', data.userId, ')');

    // 通知管理员有新用户连接
    admins.forEach((admin) => {
      socket.to(admin.socketId).emit('user:connected', {
        userId: data.userId,
        userName: data.userName,
        userAvatar: data.userAvatar
      });
    });
  });

  // 管理员连接
  socket.on('admin:connect', (data) => {
    admins.set(socket.id, {
      adminId: data.adminId,
      adminName: data.adminName,
      socketId: socket.id
    });
    console.log('管理员连接:', data.adminName);

    // 通知管理员连接成功
    socket.emit('admin:connected', {
      adminId: data.adminId,
      adminName: data.adminName,
      message: '管理员连接成功'
    });
  });

  // 发送消息
  socket.on('message:send', (data) => {
    console.log('收到消息:', data);

    // 广播消息给相关用户和管理员
    if (data.senderType === 'user') {
      // 消息来自用户，发送给管理员
      admins.forEach((admin) => {
        socket.to(admin.socketId).emit('message:receive', data);
      });
      // 同时发送给发送者自己
      socket.emit('message:receive', data);
    } else if (data.senderType === 'admin') {
      // 消息来自管理员，发送给指定用户
      users.forEach((user) => {
        if (user.userId === data.receiverId) {
          socket.to(user.socketId).emit('message:receive', data);
        }
      });
      // 同时发送给发送者自己
      socket.emit('message:receive', data);
    }
  });

  // 预约状态更新通知
  socket.on('rental:update', (data) => {
    console.log('预约状态更新:', data);

    // 通知相关用户
    users.forEach((user) => {
      if (user.userId === data.userId) {
        socket.to(user.socketId).emit('rental:updated', data);
      }
    });

    // 通知所有管理员
    admins.forEach((admin) => {
      socket.to(admin.socketId).emit('rental:updated', data);
    });
  });

  // 断开连接
  socket.on('disconnect', () => {
    console.log('WebSocket断开连接:', socket.id);

    // 检查是否是用户
    if (users.has(socket.id)) {
      const user = users.get(socket.id);
      users.delete(socket.id);
      console.log('用户断开连接:', user.userName);

      // 通知管理员用户断开连接
      admins.forEach((admin) => {
        socket.to(admin.socketId).emit('user:disconnected', {
          userId: user.userId,
          userName: user.userName
        });
      });
    }

    // 检查是否是管理员
    if (admins.has(socket.id)) {
      const admin = admins.get(socket.id);
      admins.delete(socket.id);
      console.log('管理员断开连接:', admin.adminName);
    }
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: err.message
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`局域网访问地址: http://0.0.0.0:${PORT}`);
  console.log(`WebSocket服务已启动`);
});