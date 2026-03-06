const config = require('../../config.js')

Page({
  data: {
    cameras: [],
    loading: true,
    showDetailModal: false,
    selectedCamera: null,
    userName: '',
    userPhone: '',
    startDate: '',
    endDate: '',
    totalPrice: 0,
    renting: false
  },

  onLoad: function (options) {
    this.loadCameras()
  },

  onReady: function () {
    console.log('首页渲染完成')
  },

  onShow: function () {
    console.log('首页显示')
  },

  onHide: function () {
    console.log('首页隐藏')
  },

  onUnload: function () {
    console.log('首页卸载')
  },

  loadCameras: function () {
    this.setData({ loading: true })

    wx.request({
      url: `${config.API_BASE_URL}/cameras`,
      method: 'GET',
      success: (res) => {
        if (res.data.success) {
          this.setData({
            cameras: res.data.data,
            loading: false
          })
        } else {
          wx.showToast({
            title: '加载失败',
            icon: 'none'
          })
          this.setData({ loading: false })
        }
      },
      fail: (err) => {
        console.error('加载相机列表失败:', err)
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        })
        this.setData({ loading: false })
      }
    })
  },

  showCameraDetail: function (e) {
    const camera = e.currentTarget.dataset.camera
    if (camera.status !== 'available') {
      wx.showToast({
        title: '该相机不可预约',
        icon: 'none'
      })
      return
    }

    this.setData({
      selectedCamera: camera,
      showDetailModal: true,
      userName: '',
      userPhone: '',
      startDate: '',
      endDate: '',
      totalPrice: 0
    })
  },

  closeModal: function () {
    this.setData({
      showDetailModal: false,
      selectedCamera: null
    })
  },

  stopPropagation: function () {
  },

  onNameInput: function (e) {
    this.setData({
      userName: e.detail.value
    })
  },

  onPhoneInput: function (e) {
    this.setData({
      userPhone: e.detail.value
    })
  },

  onStartDateChange: function (e) {
    this.setData({
      startDate: e.detail.value
    })
    this.calculatePrice()
  },

  onEndDateChange: function (e) {
    this.setData({
      endDate: e.detail.value
    })
    this.calculatePrice()
  },

  calculatePrice: function () {
    const { startDate, endDate, selectedCamera } = this.data
    if (startDate && endDate && selectedCamera) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24))

      if (days > 0) {
        const price = (selectedCamera.price * days).toFixed(2)
        this.setData({
          totalPrice: price
        })
      } else {
        this.setData({
          totalPrice: 0
        })
      }
    }
  },

  confirmRent: function () {
    const { selectedCamera, userName, userPhone, startDate, endDate, renting } = this.data

    if (renting) {
      return
    }

    if (!userName || !userPhone || !startDate || !endDate) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    if (end <= start) {
      wx.showToast({
        title: '结束日期必须大于开始日期',
        icon: 'none'
      })
      return
    }

    this.setData({ renting: true })

    wx.request({
      url: `${config.API_BASE_URL}/rent`,
      method: 'POST',
      data: {
        cameraId: selectedCamera.id,
        userName: userName,
        userPhone: userPhone,
        startDate: startDate,
        endDate: endDate
      },
      success: (res) => {
        if (res.data.success) {
          wx.showToast({
            title: '预约成功',
            icon: 'success'
          })
          this.closeModal()
          this.loadCameras()
        } else {
          wx.showToast({
            title: res.data.message || '预约失败',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        console.error('预约失败:', err)
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        })
      },
      complete: () => {
        this.setData({ renting: false })
      }
    })
  }
})