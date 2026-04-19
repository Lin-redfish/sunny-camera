Page({
  data: {
    cameras: []
  },

  onLoad() {
    this.loadCameras();
  },

  loadCameras() {
    wx.showLoading({
      title: '加载中...'
    });

    // 调用相机列表API
    wx.request({
      url: 'https://sunnycamera.online/api/cameras',
      method: 'GET',
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
  }
});