Page({
  data: {
    userInfo: {},
    cameras: []
  },

  onLoad() {
    this.checkLoginStatus();
    // 使用 Promise 处理异步函数
    this.loadCameras().catch(err => {
      console.error('加载相机失败:', err);
    });
  },

  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        userInfo
      });
    } else {
      // 未登录，跳转到登录页面
      wx.navigateTo({
        url: '../login/login'
      });
    }
  },

  async loadCameras() {
    wx.showLoading({
      title: '加载中...'
    });

    try {
      // 调用相机列表API
      const response = await new Promise((resolve, reject) => {
        wx.request({
          url: 'https://sunnycamera.online/api/cameras',
          method: 'GET',
          data: {
            status: 'available'
          },
          success: (res) => resolve(res),
          fail: (err) => reject(err)
        });
      });

      const data = response.data;

      if (data && data.success) {
        // 为相机添加默认图片
        const cameras = data.data.map(camera => ({
          ...camera,
          image: camera.image_url || '/images/default-camera.jpg'
        }));

        this.setData({
          cameras
        });
      }
    } catch (error) {
      console.error('获取相机列表失败:', error);
      wx.showToast({
        title: '获取相机列表失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  gotoDetail(e) {
    const cameraId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `../detail/detail?id=${cameraId}`
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

          // 跳转到登录页面
          wx.navigateTo({
            url: '../login/login'
          });
        }
      }
    });
  }
});
