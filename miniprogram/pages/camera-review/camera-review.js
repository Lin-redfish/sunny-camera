Page({
  data: {
    star: 0,
    content: '',
    rentalId: ''
  },

  onLoad(options) {
    this.setData({
      rentalId: options.rentalId
    });
  },

  setStar(e) {
    const star = parseInt(e.currentTarget.dataset.star);
    this.setData({
      star
    });
  },

  bindContentInput(e) {
    this.setData({
      content: e.detail.value
    });
  },

  submitReview() {
    if (this.data.star === 0) {
      wx.showToast({
        title: '请选择评价星级',
        icon: 'none'
      });
      return;
    }

    if (!this.data.content) {
      wx.showToast({
        title: '请输入评价内容',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '提交中...'
    });

    // 调用评价API
    wx.request({
      url: 'https://sunnycamera.online/api/reviews',
      method: 'POST',
      data: {
        rentalId: this.data.rentalId,
        star: this.data.star,
        content: this.data.content
      },
      success: (res) => {
        wx.hideLoading();
        const data = res.data;
        if (data && data.success) {
          wx.showToast({
            title: '评价成功',
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
            title: '评价失败',
            icon: 'none'
          });
        }
      },
      fail: (error) => {
        wx.hideLoading();
        console.error('提交评价失败:', error);
        wx.showToast({
          title: '评价失败，请重试',
          icon: 'none'
        });
      }
    });
  }
});