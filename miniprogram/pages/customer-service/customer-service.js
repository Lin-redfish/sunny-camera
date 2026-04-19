Page({
  data: {
    messages: [],
    inputMessage: '',
    conversationId: '',
    userId: ''
  },

  onLoad() {
    this.initChat();
  },

  onShow() {
    // 页面显示时加载消息
    this.loadMessages();
  },

  initChat() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        userId: userInfo.id || userInfo.openid
      });
      this.createOrGetConversation();
    }
  },

  createOrGetConversation() {
    wx.request({
      url: 'https://sunnycamera.online/api/conversations',
      method: 'GET',
      data: {
        user_id: this.data.userId
      },
      success: (res) => {
        const data = res.data;
        if (data && data.success) {
          if (data.data.length > 0) {
            this.setData({
              conversationId: data.data[0].id
            });
            this.loadMessages();
          } else {
            // 创建新会话
            this.createConversation();
          }
        }
      },
      fail: (error) => {
        console.error('获取会话失败:', error);
      }
    });
  },

  createConversation() {
    const userInfo = wx.getStorageSync('userInfo');
    wx.request({
      url: 'https://sunnycamera.online/api/messages',
      method: 'POST',
      data: {
        user_id: this.data.userId,
        user_name: userInfo.nickname || '用户',
        user_avatar: userInfo.avatar || '',
        content: '您好，我需要咨询相机租赁相关问题',
        sender_type: 'user',
        sender_name: userInfo.nickname || '用户',
        sender_avatar: userInfo.avatar || ''
      },
      success: (res) => {
        const data = res.data;
        if (data && data.success) {
          this.setData({
            conversationId: data.data.conversation_id
          });
          this.loadMessages();
        }
      },
      fail: (error) => {
        console.error('创建会话失败:', error);
      }
    });
  },

  loadMessages() {
    if (!this.data.conversationId) return;

    wx.request({
      url: `https://sunnycamera.online/api/conversations/${this.data.conversationId}/messages`,
      method: 'GET',
      success: (res) => {
        const data = res.data;
        if (data && data.success) {
          this.setData({
            messages: data.data
          });
          // 滚动到底部
          setTimeout(() => {
            const messageList = wx.createSelectorQuery().select('#messageList');
            messageList.scrollTo({ scrollTop: 99999, duration: 0 });
            messageList.exec();
          }, 100);
        }
      },
      fail: (error) => {
        console.error('获取消息失败:', error);
      }
    });
  },

  bindMessageInput(e) {
    this.setData({
      inputMessage: e.detail.value
    });
  },

  sendMessage() {
    if (!this.data.inputMessage.trim()) return;

    const userInfo = wx.getStorageSync('userInfo');
    const messageContent = this.data.inputMessage;

    wx.request({
      url: 'https://sunnycamera.online/api/messages',
      method: 'POST',
      data: {
        conversation_id: this.data.conversationId,
        content: messageContent,
        sender_type: 'user',
        sender_name: userInfo.nickname || '用户',
        sender_avatar: userInfo.avatar || ''
      },
      success: (res) => {
        const data = res.data;
        if (data && data.success) {
          this.setData({
            inputMessage: ''
          });
          // 重新加载消息
          this.loadMessages();
        }
      },
      fail: (error) => {
        console.error('发送消息失败:', error);
        wx.showToast({
          title: '发送失败，请重试',
          icon: 'none'
        });
      }
    });
  },

  formatTime(timeStr) {
    const date = new Date(timeStr);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
});