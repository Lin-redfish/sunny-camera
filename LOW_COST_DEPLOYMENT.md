# 低成本部署方案

## 方案对比

| 方案 | 成本 | 优点 | 缺点 | 推荐度 |
|------|--------|------|--------|---------|
| 免费Serverless | 0-50元/月 | 按量付费，自动扩容 | 需要学习 | ⭐⭐⭐⭐⭐⭐ |
| 内网穿透+家用电脑 | 0元/月 | 完全免费 | 需要电脑24小时开机 | ⭐⭐⭐⭐ |
| 免费云服务器 | 0元/年 | 完全免费 | 配置低，不稳定 | ⭐⭐ |
| 廉价VPS | 10-30元/月 | 稳定可靠 | 性能有限 | ⭐⭐⭐⭐⭐ |

---

## 方案1：免费Serverless（强烈推荐）

### 1.1 腾讯云Serverless

**优点**：
- 每月有免费额度
- 按量付费，用多少付多少
- 自动扩缩容
- 无需管理服务器

**免费额度**：
- 调用次数：100万次/月
- 资源使用：400,000 GBs/月
- 公网出流量：5GB/月

**估算成本**：
- 小程序调用API：假设每天100次 × 30天 = 3000次/月
- 远低于免费额度，**完全免费**

**部署步骤**：

#### 1. 安装Serverless Framework
```bash
npm install -g serverless
```

#### 2. 创建serverless配置
在backend目录创建 `serverless.yml`：

```yaml
component: scf
name: camera-rental-backend

inputs:
  src: ./
  name: ${name}
  region: ap-guangzhou
  runtime: Nodejs16.13
  handler: server.handler
  description: 相机租赁后端API

  environment:
    variables:
      DB_HOST: 你的数据库地址
      DB_USER: root
      DB_PASSWORD: 你的密码
      DB_NAME: camera_rental
```

#### 3. 部署
```bash
cd backend
serverless deploy
```

**注意**：需要单独购买MySQL数据库（腾讯云云数据库MySQL，约50元/月）

---

### 1.2 阿里云函数计算

**优点**：
- 每月有免费额度
- 按量付费
- 国内访问快

**免费额度**：
- 调用次数：100万次/月
- 资源使用：40万CU-秒
- 公网出流量：1GB

**估算成本**：
- 完全在免费额度内，**0元/月**

**部署步骤**：

#### 1. 安装Fun工具
```bash
npm install -g @alicloud/fun
```

#### 2. 配置
创建 `template.yml`：

```yaml
ROSTemplateFormatVersion: '2015-09-01'
Transform: 'Aliyun::Serverless-2018-04-03'
Resources:
  camera-rental-service:
    Type: 'Aliyun::Serverless::Service'
    Properties:
      Description: 相机租赁服务
      InternetAccess: true
    camera-rental-function:
      Type: 'Aliyun::Serverless::Function'
      Properties:
        Handler: server.handler
        Runtime: nodejs14
        CodeUri: ./
        MemorySize: 512
        Timeout: 10
      Events:
        HttpTrigger:
          Type: HTTP
          Properties:
            AuthType: ANONYMOUS
            Methods: ['GET', 'POST']
```

#### 3. 部署
```bash
fun deploy
```

---

## 方案2：内网穿透（完全免费）

### 2.1 使用花生壳

**优点**：
- 完全免费
- 无需购买服务器
- 适合小规模使用

**步骤**：

#### 1. 注册花生壳
- 访问：https://hsk.oray.com/
- 注册账号并登录

#### 2. 下载客户端
- 下载花生壳客户端
- 安装到你的电脑

#### 3. 配置映射
- 添加映射：本地3000端口 → 外网域名
- 会生成一个免费域名，例如：`abc123.hsk.oray.com`

#### 4. 修改小程序配置
```javascript
// config.js
module.exports = {
  API_BASE_URL: 'http://abc123.hsk.oray.com/api'
}
```

**注意**：
- 免费版有流量限制（1GB/月）
- 需要你的电脑24小时开机
- 适合测试或小规模使用

### 2.2 使用ngrok

**优点**：
- 国际知名工具
- 配置简单

**步骤**：

#### 1. 下载ngrok
- 访问：https://ngrok.com/
- 下载Windows版本

#### 2. 运行ngrok
```bash
ngrok http 3000
```

会生成地址，例如：`https://abc123.ngrok.io`

#### 3. 修改小程序配置
```javascript
// config.js
module.exports = {
  API_BASE_URL: 'https://abc123.ngrok.io/api'
}
```

**注意**：
- 免费版速度慢
- 每次重启地址会变
- 不适合正式上线

---

## 方案3：免费云服务器

### 3.1 Oracle Cloud Free Tier

**优点**：
- 永久免费
- 性能不错

**配置**：
- 2核CPU
- 24GB内存
- 200GB存储

**申请地址**：
https://www.oracle.com/cloud/free/

**部署步骤**：
与普通云服务器相同，参考DEPLOYMENT.md

### 3.2 Google Cloud Free Tier

**优点**：
- 永久免费
- 稳定可靠

**配置**：
- 1核CPU
- 0.6GB内存
- 30GB存储

**申请地址**：
https://cloud.google.com/free

**注意**：
- 需要绑定信用卡
- 国内访问可能较慢

---

## 方案4：廉价VPS（10-30元/月）

### 4.1 腾讯云轻量应用服务器

**价格**：
- 2核2G：24元/月
- 2核4G：34元/月

**购买地址**：
https://cloud.tencent.com/act/lighthouse

### 4.2 阿里云轻量应用服务器

**价格**：
- 2核2G：24元/月
- 2核4G：34元/月

**购买地址**：
https://www.aliyun.com/product/swas

### 4.3 Vultr（国外）

**价格**：
- 1核1G：5美元/月（约35元/月）

**购买地址**：
https://www.vultr.com/

**注意**：
- 国外服务器访问慢
- 不需要备案

---

## 数据库成本优化

### 使用云数据库

**腾讯云MySQL**：
- 基础版：50元/月
- 按量付费：约0.02元/GB

**阿里云RDS MySQL**：
- 基础版：50元/月
- 按量付费：约0.02元/GB

### 使用免费数据库

**PlanetScale**：
- 免费额度：5GB存储
- 10亿行读取/月
- 适合小规模应用

**Supabase**：
- 免费额度：500MB存储
- 2GB传输/月
- PostgreSQL数据库

---

## 推荐方案（按成本排序）

### 最省钱：花生壳内网穿透
- **成本**：0元/月
- **适用**：小规模、测试
- **缺点**：需要电脑24小时开机

### 性价比最高：腾讯云Serverless + 云数据库
- **成本**：50元/月（数据库）
- **适用**：正式上线
- **优点**：稳定、自动扩容

### 稳定可靠：腾讯云轻量服务器
- **成本**：24元/月
- **适用**：正式上线
- **优点**：完全掌控、稳定

---

## 我的建议

根据你的情况（相机租一次几十块），我推荐：

### 方案A：腾讯云Serverless（推荐）
- **成本**：50元/月（仅数据库）
- **优点**：稳定、自动扩容
- **适合**：正式上线

### 方案B：花生壳内网穿透
- **成本**：0元/月
- **优点**：完全免费
- **适合**：测试或小规模

### 方案C：腾讯云轻量服务器
- **成本**：24元/月
- **优点**：稳定可靠
- **适合**：正式上线

---

## 快速开始

### 选择方案A（Serverless）：
1. 注册腾讯云账号
2. 开通云数据库MySQL（50元/月）
3. 按照本文档部署Serverless
4. 修改config.js为API地址

### 选择方案B（花生壳）：
1. 注册花生壳账号
2. 下载客户端
3. 配置端口映射
4. 修改config.js为花生壳域名

### 选择方案C（轻量服务器）：
1. 购买腾讯云轻量服务器（24元/月）
2. 按照DEPLOYMENT.md部署
3. 修改config.js为服务器IP

---

## 成本对比

| 方案 | 月成本 | 年成本 | 推荐场景 |
|------|--------|--------|----------|
| 花生壳 | 0元 | 0元 | 测试/小规模 |
| Serverless | 50元 | 600元 | 正式上线 |
| 轻量服务器 | 24元 | 288元 | 正式上线 |
| 普通服务器 | 100元 | 1200元 | 大规模 |

---

## 下一步

1. 选择一个方案
2. 按照对应步骤部署
3. 测试API是否正常
4. 提交小程序审核

需要我帮你配置哪个方案？