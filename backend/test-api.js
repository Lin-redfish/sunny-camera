const http = require('http');

// 测试根路径
const testRoot = () => {
  console.log('测试根路径...');
  const req = http.request('http://localhost:3000', (res) => {
    console.log(`状态码: ${res.statusCode}`);
    res.on('data', (chunk) => {
      console.log(`响应: ${chunk.toString()}`);
    });
  });
  req.end();
};

// 测试登录API
const testLogin = () => {
  console.log('\n测试登录API...');
  const postData = JSON.stringify({
    username: 'admin',
    password: 'admin123'
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log(`状态码: ${res.statusCode}`);
    res.on('data', (chunk) => {
      console.log(`响应: ${chunk.toString()}`);
    });
  });

  req.on('error', (e) => {
    console.error(`请求失败: ${e.message}`);
  });

  req.write(postData);
  req.end();
};

// 运行测试
testRoot();
testLogin();
