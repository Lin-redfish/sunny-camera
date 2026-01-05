# 相机租赁小程序

## 项目结构

```
相机租赁/
├── app.json              # 小程序全局配置
├── app.js                # 小程序主逻辑
├── app.wxss              # 全局样式
├── sitemap.json          # 站点地图配置
├── pages/
│   └── index/
│       ├── index.wxml    # 首页页面结构
│       ├── index.js      # 首页逻辑
│       ├── index.json    # 首页配置
│       └── index.wxss    # 首页样式
├── backend/              # 后端服务
│   ├── server.js         # 服务器入口
│   ├── package.json      # 依赖配置
│   ├── .env              # 环境变量
│   ├── config/
│   │   └── database.js   # 数据库配置
│   └── routes/
│       └── api.js        # API路由
└── database/
    └── schema.sql        # 数据库表结构
```

## 数据库配置

1. 安装 MySQL 数据库
2. 创建数据库并导入表结构：

```bash
mysql -u root -p < database/schema.sql
```

3. 修改 `backend/.env` 文件，配置数据库连接信息：

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=camera_rental
```

## 后端服务启动

1. 进入后端目录：

```bash
cd backend
```

2. 安装依赖：

```bash
npm install
```

3. 启动服务：

```bash
npm start
```

或使用开发模式（自动重启）：

```bash
npm run dev
```

服务将在 http://localhost:3000 启动

## API 接口

### 获取相机列表
- **GET** `/api/cameras`
- **参数**：
  - `status` (可选): 相机状态
  - `brand` (可选): 相机品牌
- **响应**：
```json
{
  "success": true,
  "data": [...]
}
```

### 获取相机详情
- **GET** `/api/cameras/:id`
- **响应**：
```json
{
  "success": true,
  "data": {...}
}
```

### 租赁相机
- **POST** `/api/rent`
- **请求体**：
```json
{
  "cameraId": 1,
  "userName": "张三",
  "userPhone": "13800138000",
  "startDate": "2026-01-10",
  "endDate": "2026-01-15"
}
```
- **响应**：
```json
{
  "success": true,
  "message": "租赁成功",
  "data": {
    "rentalId": 1,
    "totalPrice": "1500.00",
    "days": 5
  }
}
```

### 归还相机
- **POST** `/api/return`
- **请求体**：
```json
{
  "rentalId": 1
}
```
- **响应**：
```json
{
  "success": true,
  "message": "归还成功"
}
```

### 获取租赁记录
- **GET** `/api/rentals`
- **参数**：
  - `userPhone` (可选): 租赁人电话
  - `status` (可选): 租赁状态
- **响应**：
```json
{
  "success": true,
  "data": [...]
}
```

## 小程序使用

1. 使用微信开发者工具打开项目
2. 确保后端服务已启动
3. 小程序会自动加载相机列表
4. 点击可租赁的相机可以查看详情并进行租赁

## 功能特性

- 相机列表展示（可上下滑动）
- 相机详情查看
- 相机租赁功能
- 自动计算租赁价格
- 租赁记录管理
- 相机状态管理（可租赁/已租出/维护中）

## 配置说明

### API地址配置

小程序的API地址配置在 `config.js` 文件中：

```javascript
module.exports = {
  API_BASE_URL: 'http://localhost:3000/api'
}
```

### 手机预览配置

如果需要在手机上预览，需要将 `config.js` 中的 `API_BASE_URL` 修改为你的电脑局域网IP地址：

1. 查看电脑的局域网IP地址（Windows）：
   ```bash
   ipconfig
   ```
   找到"IPv4 地址"，例如：192.168.1.100

2. 修改 `config.js`：
   ```javascript
   module.exports = {
     API_BASE_URL: 'http://192.168.1.100:3000/api'
   }
   ```

3. 确保手机和电脑在同一个WiFi网络下

4. 确保后端服务已启动并监听所有网络接口（修改 `backend/server.js`）：
   ```javascript
   app.listen(PORT, '0.0.0.0', () => {
     console.log(`服务器运行在 http://0.0.0.0:${PORT}`)
   })
   ```

### 微信开发者工具配置

在微信开发者工具中：
1. 点击右上角"详情"
2. 选择"本地设置"
3. 勾选"不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书"

这样可以在开发阶段使用HTTP协议，无需配置HTTPS域名。

## 常见问题

### 手机预览显示"网络错误"

**原因**：手机无法访问 `localhost`，因为 `localhost` 指向的是手机本身，而不是电脑。

**解决方法**：
1. 将 `config.js` 中的 `API_BASE_URL` 改为电脑的局域网IP地址
2. 确保手机和电脑在同一WiFi网络
3. 确保电脑防火墙允许3000端口访问
4. 在微信开发者工具中关闭域名校验

### 后端服务启动失败

**检查项**：
1. MySQL服务是否已启动
2. 数据库密码是否正确配置在 `backend/.env` 中
3. 3000端口是否被其他程序占用
4. 是否已执行 `npm install` 安装依赖

### 相机列表加载失败

**检查项**：
1. 后端服务是否正常运行
2. `config.js` 中的API地址是否正确
3. 数据库中是否有相机数据
4. 浏览器控制台或微信开发者工具控制台是否有错误信息