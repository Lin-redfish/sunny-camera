App({
  onLaunch() {
    // 小程序启动时执行
    console.log('小程序启动');
    
    // 检查登录状态
    this.checkLoginStatus();
    
    // 初始化 WebSocket 连接
    this.initWebSocket();
  },
  
  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo');
    const expiresAt = wx.getStorageSync('expiresAt');
    
    if (userInfo && expiresAt) {
      const now = new Date().getTime();
      const expireTime = new Date(expiresAt).getTime();
      
      if (now > expireTime) {
        // 登录已过期，清除登录状态
        wx.removeStorageSync('userInfo');
        wx.removeStorageSync('sessionKey');
        wx.removeStorageSync('expiresAt');
        console.log('登录已过期');
      } else {
        console.log('登录状态有效');
        // 登录状态有效，连接 WebSocket
        this.initWebSocket();
      }
    }
  },
  
  initWebSocket() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) return;
    
    console.log('初始化 WebSocket 连接');
    
    // 创建 WebSocket 连接
    this.socket = wx.connectSocket({
      url: 'ws://localhost:3001/socket.io/?EIO=4&transport=websocket',
      success: () => {
        console.log('WebSocket 连接成功');
      },
      fail: (error) => {
        console.error('WebSocket 连接失败:', error);
      }
    });
    
    // 监听连接打开
    this.socket.onOpen(() => {
      console.log('WebSocket 连接已打开');
      
      // 发送 Socket.IO 握手消息
      this.socket.send({ data: '2probe' });
      
      // 发送用户连接事件
      setTimeout(() => {
        this.sendUserConnect();
      }, 1000);
    });
    
    // 监听接收消息
    this.socket.onMessage((res) => {
      console.log('收到 WebSocket 消息:', res.data);
      
      // 处理 Socket.IO 消息
      this.handleSocketIOMessage(res.data);
    });
    
    // 监听连接关闭
    this.socket.onClose(() => {
      console.log('WebSocket 连接已关闭');
      // 尝试重连
      setTimeout(() => {
        this.initWebSocket();
      }, 5000);
    });
    
    // 监听连接错误
    this.socket.onError((error) => {
      console.error('WebSocket 错误:', error);
    });
  },
  
  handleSocketIOMessage(data) {
    // 处理 Socket.IO 消息格式
    if (data === '3probe') {
      // 响应探针
      this.socket.send({ data: '5' });
      return;
    }
    
    // 解析 Socket.IO 消息
    if (data.charAt(0) === '4') {
      // 事件消息
      try {
        const message = JSON.parse(data.substring(1));
        const [event, eventData] = message;
        console.log('Socket.IO 事件:', event, eventData);
        
        // 处理事件
        this.handleWebSocketEvent(event, eventData);
      } catch (error) {
        console.error('解析 Socket.IO 消息失败:', error);
      }
    }
  },
  
  handleWebSocketEvent(event, data) {
    switch (event) {
      case 'rental:updated':
        // 预约状态更新
        this.triggerEvent('rental:updated', data);
        break;
      case 'message:receive':
        // 收到新消息
        this.triggerEvent('message:receive', data);
        break;
      default:
        console.log('未知事件类型:', event);
    }
  },
  
  // 触发全局事件
  triggerEvent(eventName, data) {
    if (this.eventListeners && this.eventListeners[eventName]) {
      this.eventListeners[eventName].forEach(callback => {
        callback(data);
      });
    }
  },
  
  // 监听全局事件
  on(eventName, callback) {
    if (!this.eventListeners) {
      this.eventListeners = {};
    }
    if (!this.eventListeners[eventName]) {
      this.eventListeners[eventName] = [];
    }
    this.eventListeners[eventName].push(callback);
  },
  
  // 移除事件监听
  off(eventName, callback) {
    if (this.eventListeners && this.eventListeners[eventName]) {
      this.eventListeners[eventName] = this.eventListeners[eventName].filter(cb => cb !== callback);
    }
  },
  
  // 发送 Socket.IO 事件
  sendSocketEvent(event, data) {
    if (this.socket && this.socket.readyState === 1) {
      const message = JSON.stringify([event, data]);
      this.socket.send({ data: `42${message}` });
    }
  },
  
  // 发送用户连接事件
  sendUserConnect() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) return;
    
    this.sendSocketEvent('user:connect', {
      userId: userInfo.id,
      userName: userInfo.nickname,
      userAvatar: userInfo.avatar
    });
  },
  
  globalData: {
    userInfo: null,
    socket: null
  }
});
