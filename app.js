App({
  onLaunch: function () {
    console.log('小程序启动')
  },
  onShow: function (options) {
    console.log('小程序显示')
  },
  onHide: function () {
    console.log('小程序隐藏')
  },
  onError: function (msg) {
    console.log('小程序错误', msg)
  },
  globalData: {
    userInfo: null
  }
})