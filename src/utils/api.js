import wepy from 'wepy'

// 服务器地址
const host = 'https://ccinfo.purson.xyz/api'

// 普通请求
const request = async (options, showLoading = true) => {
  // 简化开发，如果传入字符串则转换成 对象
  if (typeof options === 'string') {
    options = {
      url: options
    }
  }

// 显示加载中
  if (showLoading) {
    wepy.showLoading({title: '加载中'})
  }

// 拼接请求地址
  options.url = host + '/' + options.url

// 调用小程序request方法
  let response = await wepy.request(options)

  if (showLoading) {
  // 隐藏加载中
    wepy.hideLoading()
  }
// 服务器异常后给予提示
  if (response.statusCode === 500) {
    wepy.showModal({
      title: '提示',
      content: '服务器错误，请联系管理员或重试'

    })
  }

  return response
}






export default {
  request,
}
