Page({
  data: {
    userInfo: {}
  },

  onLoad() {
    this.loadUserInfo();
  },

  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        userInfo
      });
    }
  },

  gotoLogin() {
    wx.navigateTo({
      url: '../login/login'
    });
  },

  logout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除登录状态
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('sessionKey');
          wx.removeStorageSync('expiresAt');
          
          // 刷新页面
          this.setData({
            userInfo: {}
          });
        }
      }
    });
  }
});