const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.json({
    message: '相机租赁API服务',
    version: '1.0.0',
    endpoints: {
      cameras: 'GET /api/cameras - 获取相机列表',
      cameraDetail: 'GET /api/cameras/:id - 获取相机详情',
      rent: 'POST /api/rent - 租赁相机',
      return: 'POST /api/return - 归还相机',
      rentals: 'GET /api/rentals - 获取租赁记录'
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`局域网访问地址: http://0.0.0.0:${PORT}`);
});