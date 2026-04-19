Page({
  data: {
    rentals: [],
    hasActiveRentals: false
  },

  onLoad() {
    this.loadRentalRecords();
  },

  loadRentalRecords() {
    wx.showLoading({
      title: '加载中...'
    });

    // 调用租赁记录API
    wx.request({
      url: 'https://sunnycamera.online/api/rentals',
      method: 'GET',
      success: (res) => {
        wx.hideLoading();
        const data = res.data;
        if (data && data.success) {
          const rentals = data.data;
          const hasActiveRentals = rentals.some(rental => rental.status === 'active');
          
          this.setData({
            rentals,
            hasActiveRentals
          });
        }
      },
      fail: (error) => {
        wx.hideLoading();
        console.error('获取租赁记录失败:', error);
        wx.showToast({
          title: '获取租赁记录失败',
          icon: 'none'
        });
      }
    });
  },

  isOverdue(endDate) {
    const today = new Date();
    const end = new Date(endDate);
    return today > end;
  },

  returnCamera(e) {
    const rentalId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认归还',
      content: '确定要归还相机吗？归还后将跳转到评价页面。',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '归还中...'
          });

          // 调用归还API
          wx.request({
            url: 'https://sunnycamera.online/api/return',
            method: 'POST',
            data: {
              rentalId: rentalId
            },
            success: (res) => {
              wx.hideLoading();
              const data = res.data;
              if (data && data.success) {
                wx.showToast({
                  title: '归还成功',
                  icon: 'success'
                });
                
                // 跳转到评价页面
                setTimeout(() => {
                  wx.navigateTo({
                    url: `../camera-review/camera-review?rentalId=${rentalId}`
                  });
                }, 1500);
              } else {
                wx.showToast({
                  title: '归还失败',
                  icon: 'none'
                });
              }
            },
            fail: (error) => {
              wx.hideLoading();
              console.error('归还相机失败:', error);
              wx.showToast({
                title: '归还失败，请重试',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  }
});