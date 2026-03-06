Page({
  data: {
    camera: {},
    userName: '',
    userPhone: '',
    startDate: '',
    endDate: ''
  },

  onLoad(options) {
    const cameraId = options.id;
    // 使用 Promise 处理异步函数
    this.loadCameraDetail(cameraId).catch(err => {
      console.error('加载相机详情失败:', err);
    });
  },

  async loadCameraDetail(cameraId) {
    wx.showLoading({
      title: '加载中...'
    });

    try {
      // 调用相机详情API
      const response = await new Promise((resolve, reject) => {
        wx.request({
          url: `https://sunnycamera.online/api/cameras/${cameraId}`,
          method: 'GET',
          success: (res) => resolve(res),
          fail: (err) => reject(err)
        });
      });

      const data = response.data;

      if (data && data.success) {
        // 为相机添加默认图片
        const camera = {
          ...data.data,
          image: data.data.image_url || '/images/default-camera.jpg'
        };

        this.setData({
          camera
        });
      } else {
        wx.showToast({
          title: '获取相机详情失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('获取相机详情失败:', error);
      wx.showToast({
        title: '获取相机详情失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  bindUserNameInput(e) {
    this.setData({
      userName: e.detail.value
    });
  },

  bindUserPhoneInput(e) {
    this.setData({
      userPhone: e.detail.value
    });
  },

  bindStartDateChange(e) {
    this.setData({
      startDate: e.detail.value
    });
  },

  bindEndDateChange(e) {
    this.setData({
      endDate: e.detail.value
    });
  },

  async bookCamera() {
    const { camera, userName, userPhone, startDate, endDate } = this.data;

    if (!userName || !userPhone || !startDate || !endDate) {
      wx.showToast({
        title: '请填写完整预约信息',
        icon: 'none'
      });
      return;
    }

    // 验证日期
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      wx.showToast({
        title: '结束日期必须晚于开始日期',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '预约中...'
    });

    try {
      // 调用预约API
      const response = await new Promise((resolve, reject) => {
        wx.request({
          url: 'https://sunnycamera.online/api/rent',
          method: 'POST',
          header: {
            'Content-Type': 'application/json'
          },
          data: {
            cameraId: camera.id,
            userName,
            userPhone,
            startDate,
            endDate
          },
          success: (res) => resolve(res),
          fail: (err) => reject(err)
        });
      });

      const data = response.data;

      if (data && data.success) {
        wx.showToast({
          title: '预约成功',
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
          title: (data && data.message) || '预约失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('预约失败:', error);
      wx.showToast({
        title: '预约失败，请检查网络连接',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  }
});
