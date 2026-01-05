# 相机租赁小程序部署指南

## 第1步：注册小程序账号

### 1.1 访问微信公众平台
- 网址：https://mp.weixin.qq.com/
- 点击"立即注册"
- 选择"小程序"

### 1.2 填写账号信息
- 邮箱：使用未注册过微信的邮箱
- 密码：设置安全密码
- 确认密码：再次输入
- 验证邮箱：点击邮件中的链接

### 1.3 完善信息
- 主体类型：个人或企业
  - 个人：适合个人使用，无需营业执照
  - 企业：需要营业执照，功能更全
- 填写主体信息
- 填写管理员信息（你的微信）

### 1.4 获取AppID
- 登录后进入"开发" → "开发管理" → "开发设置"
- 复制"开发者ID(AppID)"

---

## 第2步：修改小程序配置

### 2.1 修改project.config.json
在项目根目录创建或修改 `project.config.json`：

```json
{
  "appid": "你的AppID",
  "projectname": "相机租赁",
  "description": "相机租赁小程序",
  "setting": {
    "urlCheck": false,
    "es6": true,
    "postcss": true,
    "minified": true
  },
  "compileType": "miniprogram"
}
```

### 2.2 修改app.json
确保配置正确：

```json
{
  "pages": [
    "pages/index/index"
  ],
  "window": {
    "backgroundTextStyle": "light",
    "navigationBarBackgroundColor": "#fff",
    "navigationBarTitleText": "相机租赁",
    "navigationBarTextStyle": "black"
  },
  "style": "v2",
  "lazyCodeLoading": "requiredComponents",
  "sitemapLocation": "sitemap.json"
}
```

---

## 第3步：部署后端到云服务器

### 3.1 购买云服务器
推荐平台：
- 阿里云：https://www.aliyun.com/
- 腾讯云：https://cloud.tencent.com/
- 华为云：https://www.huaweicloud.com/

配置建议：
- 系统：Ubuntu 20.04 或 CentOS 7+
- 配置：2核4G（起步）
- 带宽：1-3Mbps
- 存储：40GB+

### 3.2 服务器环境配置

#### 安装Node.js
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# 验证安装
node --version
npm --version
```

#### 安装MySQL
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y mysql-server

# CentOS
sudo yum install -y mysql-server

# 启动MySQL
sudo systemctl start mysql
sudo systemctl enable mysql
```

#### 配置MySQL
```bash
# 登录MySQL
sudo mysql

# 创建数据库和用户
CREATE DATABASE camera_rental CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'camera_user'@'%' IDENTIFIED BY '你的密码';
GRANT ALL PRIVILEGES ON camera_rental.* TO 'camera_user'@'%';
FLUSH PRIVILEGES;
EXIT;
```

#### 导入数据库
```bash
# 将database/schema.sql上传到服务器
mysql -u camera_user -p camera_rental < schema.sql
```

### 3.3 部署后端代码

#### 上传代码
```bash
# 使用scp上传
scp -r backend root@你的服务器IP:/root/

# 或使用git
git clone 你的仓库地址
cd backend
```

#### 安装依赖
```bash
cd /root/backend
npm install
```

#### 配置环境变量
```bash
nano .env
```

```env
PORT=3000
DB_HOST=localhost
DB_USER=camera_user
DB_PASSWORD=你的MySQL密码
DB_NAME=camera_rental
```

#### 启动服务（使用PM2）
```bash
# 安装PM2
npm install -g pm2

# 启动服务
pm2 start server.js --name camera-rental

# 设置开机自启
pm2 startup
pm2 save

# 查看日志
pm2 logs camera-rental
```

---

## 第4步：配置域名和HTTPS

### 4.1 购买域名
- 推荐平台：
  - 阿里云域名
  - 腾讯云域名
  - Namecheap（国外）

### 4.2 配置DNS解析
在域名服务商处添加A记录：
```
主机记录: @ 或 www
记录类型: A
记录值: 你的服务器公网IP
TTL: 600
```

### 4.3 申请SSL证书
推荐使用Let's Encrypt（免费）：

```bash
# 安装certbot
sudo apt-get install -y certbot

# 申请证书
sudo certbot certonly --standalone -d yourdomain.com

# 证书位置
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

### 4.4 配置Nginx反向代理

#### 安装Nginx
```bash
sudo apt-get install -y nginx
```

#### 配置Nginx
```bash
sudo nano /etc/nginx/sites-available/camera-rental
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 启用配置
```bash
sudo ln -s /etc/nginx/sites-available/camera-rental /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 第5步：修改小程序API地址

### 5.1 修改config.js
```javascript
module.exports = {
  API_BASE_URL: 'https://yourdomain.com/api'
}
```

### 5.2 配置服务器域名
登录微信公众平台：
1. 进入"开发" → "开发管理" → "开发设置"
2. 找到"服务器域名"
3. 添加以下域名：
   - request合法域名：`https://yourdomain.com`
   - uploadFile合法域名：`https://yourdomain.com`
   - downloadFile合法域名：`https://yourdomain.com`

**注意**：
- 必须是HTTPS
- 域名必须已备案（国内服务器）
- 每月只能修改5次

---

## 第6步：提交审核并发布

### 6.1 上传代码
1. 在微信开发者工具中点击"上传"
2. 填写版本号：1.0.0
3. 填写项目备注
4. 点击"上传"

### 6.2 提交审核
1. 登录微信公众平台
2. 进入"版本管理" → "开发版本"
3. 找到刚上传的版本
4. 点击"提交审核"

### 6.3 审核注意事项
- 审核时间：1-7个工作日
- 审核要求：
  - 小程序名称不能包含"最"、"第一"等词汇
  - 功能完整，不能是测试版
  - 符合微信小程序规范
  - 无违规内容

### 6.4 发布上线
审核通过后：
1. 进入"版本管理" → "审核版本"
2. 点击"发布"
3. 所有人都可以通过搜索找到你的小程序

---

## 成本估算

| 项目 | 费用 |
|------|--------|
| 云服务器（2核4G） | 约100-300元/月 |
| 域名 | 约50-100元/年 |
| SSL证书 | 免费（Let's Encrypt） |
| 小程序认证 | 免费（个人）/ 300元/年（企业）|
| **首年总计** | 约1500-2500元 |

---

## 快速部署方案（推荐新手）

如果你不想自己配置服务器，可以使用以下平台：

### 1. 腾讯云Serverless
- 按量付费
- 无需管理服务器
- 自动扩缩容

### 2. 阿里云函数计算
- 按量付费
- 无需管理服务器
- 自动扩缩容

### 3. Vercel/Netlify（国外）
- 免费额度
- 部署简单
- 适合前端

---

## 常见问题

### Q1: 个人小程序能上线吗？
A: 可以，但功能有限制：
- 不能使用支付功能
- 不能获取用户手机号
- 部分接口受限

### Q2: 需要备案吗？
A: 国内服务器需要备案，国外服务器不需要。

### Q3: 审核被拒怎么办？
A: 查看拒绝原因，修改后重新提交。

### Q4: 如何更新小程序？
A: 修改代码后，上传新版本，重新提交审核。

---

## 下一步

1. 先注册小程序账号
2. 购买云服务器
3. 按照步骤部署
4. 提交审核发布

需要我帮你配置哪一步？