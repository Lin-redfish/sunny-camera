App({
  onLaunch() {
    // 小程序启动时执行
    console.log('小程序启动');
    
    // 检查登录状态
    this.checkLoginStatus();
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
      }
    }
  },
  
  globalData: {
    userInfo: null
  }
});
