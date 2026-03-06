Page({
  data: {
    nickname: '',
    avatar: '',
    openid: ''
  },

  bindNicknameInput(e) {
    this.setData({
      nickname: e.detail.value
    });
  },

  bindAvatarInput(e) {
    this.setData({
      avatar: e.detail.value
    });
  },

  bindOpenidInput(e) {
    this.setData({
      openid: e.detail.value
    });
  },

  async login() {
    const { nickname, avatar, openid } = this.data;

    if (!openid) {
      wx.showToast({
        title: '请输入OpenID',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '登录中...'
    });

    try {
      // 调用登录API
      const response = await new Promise((resolve, reject) => {
        wx.request({
          url: 'https://sunnycamera.online/api/user/login',
          method: 'POST',
          header: {
            'Content-Type': 'application/json'
          },
          data: {
            openid,
            nickname,
            avatar
          },
          success: (res) => resolve(res),
          fail: (err) => reject(err)
        });
      });

      const data = response.data;

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
    } catch (error) {
      console.error('登录失败:', error);
      wx.showToast({
        title: '登录失败，请检查网络连接',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  }
});
