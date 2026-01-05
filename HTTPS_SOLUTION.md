# HTTPS解决方案

## 问题原因

微信小程序要求：
- **request合法域名必须是HTTPS协议**
- **不支持HTTP协议**

花生壳免费版：
- 只提供HTTP协议
- 不支持HTTPS

**结果**：配置时会报错"域名协议头非法"

---

## 解决方案对比

| 方案 | 成本 | HTTPS | 推荐度 | 难度 |
|------|--------|--------|---------|-------|
| 花生壳付费版 | 68元/年 | ✅ | ⭐⭐⭐ | 简单 |
| 腾讯云Serverless | 50元/月 | ✅ | ⭐⭐⭐⭐⭐ | 中等 |
| 云服务器+SSL | 24元/月 | ✅ | ⭐⭐⭐ | 中等 |
| Cloudflare Tunnel | 免费 | ✅ | ⭐⭐ | 中等 |

---

## 方案1：花生壳付费版（最简单）

### 1.1 升级到付费版
- 登录花生壳账号
- 进入"个人中心"
- 选择"升级套餐"

### 1.2 套餐价格
- **标准版**：68元/年
  - 支持HTTPS
  - 1GB流量/月
  - 适合小规模使用

- **专业版**：168元/年
  - 支持HTTPS
  - 3GB流量/月
  - 适合中等规模

### 1.3 配置HTTPS
升级后：
1. 重新配置端口映射
2. 选择HTTPS协议
3. 获取HTTPS域名：`https://abc123.hsk.oray.com`

### 1.4 修改config.js
```javascript
module.exports = {
  API_BASE_URL: 'https://abc123.hsk.oray.com/api'
}
```

**优点**：
- 配置简单，只需升级
- 域名不变
- 适合小规模使用

**缺点**：
- 需要付费（68元/年）
- 流量限制

---

## 方案2：Cloudflare Tunnel（免费HTTPS）

### 2.1 注册Cloudflare
- 访问：https://dash.cloudflare.com/sign-up
- 注册免费账号

### 2.2 安装cloudflared
```bash
# Windows下载
# 访问：https://github.com/cloudflare/cloudflared/releases
# 下载Windows版本

# 解压并运行
cloudflared tunnel --url http://localhost:3000
```

### 2.3 获取HTTPS域名
运行后会显示：
```
https://abc123.trycloudflare.com
```

### 2.4 修改config.js
```javascript
module.exports = {
  API_BASE_URL: 'https://abc123.trycloudflare.com/api'
}
```

**优点**：
- 完全免费
- 支持HTTPS
- 速度快

**缺点**：
- 域名会变
- 每次重启需要重新配置

---

## 方案3：腾讯云Serverless（推荐）

### 3.1 开通服务
1. 登录腾讯云：https://cloud.tencent.com/
2. 进入"云函数"
3. 开通云函数

### 3.2 开通云数据库
1. 进入"云数据库"
2. 开通MySQL基础版
3. 费用：约50元/月

### 3.3 部署后端
参考LOW_COST_DEPLOYMENT.md中的Serverless部署步骤

### 3.4 获取HTTPS域名
腾讯云会提供：
```
https://service-xxx.gz.apigw.tencentcs.com
```

### 3.5 修改config.js
```javascript
module.exports = {
  API_BASE_URL: 'https://service-xxx.gz.apigw.tencentcs.com/api'
}
```

**优点**：
- API调用免费（100万次/月）
- 自动HTTPS
- 稳定可靠
- 适合正式上线

**缺点**：
- 需要学习Serverless
- 数据库费用50元/月

---

## 方案4：云服务器+免费SSL（性价比高）

### 4.1 购买轻量服务器
- 腾讯云轻量：24元/月
- 阿里云轻量：24元/月
- 2核2G配置足够

### 4.2 申请免费SSL证书
使用Let's Encrypt：

```bash
# 安装certbot
sudo apt-get install -y certbot

# 申请证书
sudo certbot certonly --standalone -d yourdomain.com
```

### 4.3 配置Nginx
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
    }
}
```

### 4.4 修改config.js
```javascript
module.exports = {
  API_BASE_URL: 'https://yourdomain.com/api'
}
```

**优点**：
- 成本低（24元/月）
- 完全掌控
- 稳定可靠

**缺点**：
- 需要配置服务器
- 需要购买域名（约50元/年）

---

## 我的推荐

根据你的情况（相机租一次几十块），推荐：

### 🎯 方案1：花生壳付费版（最简单）
- **成本**：68元/年
- **优点**：配置简单，只需升级
- **适合**：小规模使用

### 🎯 方案2：腾讯云Serverless（性价比最高）
- **成本**：50元/月
- **优点**：API调用免费，自动HTTPS
- **适合**：正式上线

### 🎯 方案3：Cloudflare Tunnel（完全免费）
- **成本**：0元
- **优点**：免费HTTPS
- **适合**：测试或小规模

---

## 快速决策

### 如果想要最简单：
→ 选择**花生壳付费版**
- 只需升级账号
- 5分钟搞定

### 如果想要性价比：
→ 选择**腾讯云Serverless**
- 50元/月
- 稳定可靠

### 如果想要完全免费：
→ 选择**Cloudflare Tunnel**
- 0元
- 支持HTTPS

---

## 下一步

### 选择花生壳付费版：
1. 登录花生壳账号
2. 升级到标准版（68元/年）
3. 重新配置HTTPS映射
4. 告诉我域名，我帮你修改config.js

### 选择Serverless：
1. 注册腾讯云
2. 开通云函数和数据库
3. 按照LOW_COST_DEPLOYMENT.md部署
4. 告诉我API地址，我帮你修改config.js

### 选择Cloudflare：
1. 注册Cloudflare
2. 下载cloudflared
3. 运行并获取域名
4. 告诉我域名，我帮你修改config.js

---

## 成本对比

| 方案 | 月成本 | 年成本 | HTTPS | 推荐度 |
|------|--------|--------|--------|---------|
| Cloudflare | 0元 | 0元 | ✅ | ⭐⭐ |
| 花生壳付费 | 6元 | 68元 | ✅ | ⭐⭐⭐⭐ |
| Serverless | 50元 | 600元 | ✅ | ⭐⭐⭐⭐⭐ |
| 云服务器 | 24元 | 288元 | ✅ | ⭐⭐⭐⭐ |

---

## 我的建议

**先用Cloudflare Tunnel试试**，因为：
1. 完全免费
2. 支持HTTPS
3. 适合你的小规模使用
4. 配置相对简单

需要我帮你配置哪个方案？