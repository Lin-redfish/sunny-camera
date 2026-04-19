Page({
  data: {
    userInfo: {},
    cameras: []
  },

  onLoad() {
    this.checkLoginStatus();
    // 直接调用异步函数，不使用 Promise 链
    this.loadCameras();
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

  loadCameras() {
    wx.showLoading({
      title: '加载中...'
    });

    // 调用相机列表API
    wx.request({
      url: 'https://sunnycamera.online/api/cameras',
      method: 'GET',
      data: {
        status: 'available'
      },
      success: (res) => {
        wx.hideLoading();
        const data = res.data;
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
      },
      fail: (error) => {
        wx.hideLoading();
        console.error('获取相机列表失败:', error);
        wx.showToast({
          title: '获取相机列表失败',
          icon: 'none'
        });
      }
    });
  },

  gotoDetail(e) {
    const cameraId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `../detail/detail?id=${cameraId}`
    });
  },

  // 功能入口点击事件
  gotoCameraPreview() {
    // 相机预览功能，跳转到相机列表页面
    wx.navigateTo({
      url: '../camera-preview/camera-preview'
    });
  },

  gotoCameraBooking() {
    // 相机预约功能，跳转到相机列表页面
    wx.navigateTo({
      url: '../camera-booking/camera-booking'
    });
  },

  gotoCameraReviews() {
    // 相机归还功能，跳转到归还页面
    wx.navigateTo({
      url: '../camera-return/camera-return'
    });
  },

  gotoCustomerService() {
    // 客服交流功能，跳转到客服页面
    wx.navigateTo({
      url: '../customer-service/customer-service'
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