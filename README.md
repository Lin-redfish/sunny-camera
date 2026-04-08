# 相机预约系统

## 项目介绍

相机预约系统是一个用于管理相机租赁的全栈应用，包括：

- 小程序前端：用户可以浏览相机列表、预约相机
- 客服管理中心：管理员可以管理预约、查看用户消息
- 后端服务：提供 API 接口和 WebSocket 实时通信

## 技术栈

- 前端：HTML5, CSS3, JavaScript, 微信小程序
- 后端：Node.js, Express.js, Socket.IO
- 数据库：MySQL

## 快速开始

1. 安装依赖
```bash
cd backend
npm install
```

2. 配置数据库
编辑 backend/.env 文件，设置数据库连接信息

3. 启动服务器
```bash
cd backend
node server.js
```

4. 访问系统
- 客服管理中心：http://localhost:3001/admin.html
- 小程序：通过微信开发者工具打开 miniprogram 目录

## API 文档

### 相机相关
- GET /api/cameras - 获取相机列表
- GET /api/cameras/:id - 获取相机详情

### 预约相关
- POST /api/rent - 预约相机
- POST /api/return - 归还相机
- GET /api/rentals - 获取预约记录

### 管理员相关
- GET /api/admin/rentals - 获取所有预约记录
- PUT /api/rentals/:id - 修改预约信息
- POST /api/rentals/:id/renew - 续约预约
- POST /api/rentals/:id/cancel - 取消预约

### 聊天相关
- GET /api/conversations - 获取会话列表
- GET /api/conversations/:id/messages - 获取消息列表
- POST /api/messages - 发送消息
- PUT /api/conversations/:id/close - 关闭会话

### 用户相关
- POST /api/user/login - 用户登录
- GET /api/user/me - 获取用户信息
- PUT /api/user/me - 更新用户信息
