Page({
  data: {
    userInfo: null
  },

  onLoad() {
    // 页面加载时自动尝试登录
    this.checkLoginStatus();
  },

  checkLoginStatus() {
    // 检查是否已经登录
    const userInfo = wx.getStorageSync('userInfo');
    const sessionKey = wx.getStorageSync('sessionKey');
    const expiresAt = wx.getStorageSync('expiresAt');
    
    if (userInfo && sessionKey && expiresAt && Date.now() < expiresAt) {
      // 已经登录，直接跳转到首页
      wx.switchTab({
        url: '../index/index'
      });
    }
  },

  // 微信一键登录
  wxLogin() {
    wx.showLoading({
      title: '登录中...'
    });

    // 1. 调用微信登录API获取code
    wx.login({
      success: (loginRes) => {
        if (loginRes.code) {
          // 2. 获取用户信息（使用新的API）
          wx.getUserProfile({
            desc: '用于完善用户信息',
            success: (userInfoRes) => {
              const userInfo = userInfoRes.userInfo;
              
              // 3. 调用后端登录API
              this.loginToBackend({
                openid: loginRes.code, // 使用code作为临时openid，实际项目中应通过后端获取真实openid
                nickname: userInfo.nickName,
                avatar: userInfo.avatarUrl
              });
            },
            fail: (error) => {
              wx.hideLoading();
              console.error('获取用户信息失败:', error);
              wx.showToast({
                title: '请授权用户信息',
                icon: 'none'
              });
            }
          });
        } else {
          wx.hideLoading();
          console.error('登录失败:', loginRes.errMsg);
          wx.showToast({
            title: '登录失败，请重试',
            icon: 'none'
          });
        }
      },
      fail: (error) => {
        wx.hideLoading();
        console.error('微信登录失败:', error);
        wx.showToast({
          title: '微信登录失败，请重试',
          icon: 'none'
        });
      }
    });
  },

  // 测试模式 - 直接进入首页
  testLogin() {
    wx.showLoading({
      title: '进入测试模式...'
    });

    // 模拟登录信息
    const testUserInfo = {
      id: 1,
      openid: 'test_openid',
      nickname: '测试用户',
      avatar: 'https://example.com/avatar.jpg',
      phone: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const testSessionKey = 'test_session_key';
    const testExpiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7天有效期

    // 保存测试登录状态
    wx.setStorageSync('userInfo', testUserInfo);
    wx.setStorageSync('sessionKey', testSessionKey);
    wx.setStorageSync('expiresAt', testExpiresAt);

    wx.hideLoading();
    wx.showToast({
      title: '测试模式已开启',
      icon: 'success'
    });

    // 跳转到首页
    setTimeout(() => {
      wx.switchTab({
        url: '../index/index'
      });
    }, 1000);
  },

  // 登录到后端
  loginToBackend(userData) {
    wx.request({
      url: 'https://sunnycamera.online/api/user/login',
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: userData,
      success: (res) => {
        wx.hideLoading();
        const data = res.data;
        if (data && data.success) {
          // 保存登录状态
          wx.setStorageSync('userInfo', data.data.user);
          wx.setStorageSync('sessionKey', data.data.sessionKey);
          wx.setStorageSync('expiresAt', data.data.expiresAt);

          wx.showToast({
            title: '登录成功',
            icon: 'success'
          });

          // 跳转到首页
          setTimeout(() => {
            wx.switchTab({
              url: '../index/index'
            });
          }, 1500);
        } else {
          wx.showToast({
            title: (data && data.message) || '登录失败',
            icon: 'none'
          });
        }
      },
      fail: (error) => {
        wx.hideLoading();
        console.error('登录失败:', error);
        wx.showToast({
          title: '登录失败，请检查网络连接',
          icon: 'none'
        });
      }
    });
  }
});