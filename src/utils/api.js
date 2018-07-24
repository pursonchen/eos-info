import wepy from 'wepy'

// 服务器地址
const host = 'http://larabbs.test/api'

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

// 登录
const login = async (params = {}) => {
  // code 只能使用一次，所以每次单独调用
  let loginData = await wepy.login()

  // 参数中增加code
  params.code = loginData.code

  // 接口请求 weapp/authorizations
  let authResponse = await request({
    url: 'weapp/authorizations',
    data: params,
    method: 'POST'
  })

  // 登录成功，记录 token 信息
  if (authResponse.statusCode === 201) {
    wepy.setStorageSync('access_token', authResponse.data.access_token)
    wepy.setStorageSync('access_token_expired_at', new Date().getTime() + authResponse.data.expires_in * 1000)
  }

  return authResponse
}

// 刷新token
const refreshToken = async (accessToken) => {
  // 请求刷新接口
  let refreshResponse = await wepy.request({
    url: host + '/' + 'authorizations/current',
    method: 'PUT',
    header: {
      'Authorization': 'Bearer' + accessToken
    }
  })

  // 刷新成功状态码为200
  if (refreshResponse.statusCode === 200) {
    // 将Token及过期时间保存在storage中
    wepy.setStorageSync('access_token', refreshResponse.data.access_token)
    wepy.setStorageSync('access_token_expired_at', new Date().getTime() + refreshResponse.data.expires_in * 1000)
  }

  return refreshResponse
}

// 获取Token
const getToken = async (options) => {
  // 从缓存中取出Token
  let accessToken = wepy.getStorageSync('access_token')
  let expiredAt = wepy.getStorageSync('access_token_expired_at')

  // 如果Token过期了，则调用刷新方法
  if (accessToken && new Date().getTime() > expiredAt) {
    let refreshResponse = await refreshToken(accessToken)

    // 刷新成功
    if (refreshToken.statusCode === 200) {
      accessToken = refreshResponse.data.access_token
    } else {
      // 刷新失败了，重新调用登录方法，设置Token
      let authResponse = await login()
      if (authResponse.statusCode === 201) {
        accessToken = authResponse.data.access_token
      }
    }
  }

  return accessToken
}

const authRequest = async (options, showLoading = true) => {
  if (typeof options === 'string') {
    options = {
      url: options
    }
  }

  // 获取Token
  let accessToken = await getToken()

  // 将Token 设置在header中
  let header = options.header || {}
  header.Authorization = 'Bearer ' + accessToken
  options.header = header

  return request(options, showLoading)
}

const logout = async (params = {}) => {
  let accessToken = wepy.getStorageSync('access_token')
  // 调用删除Token接口，让Token失效
  let logoutResponse = await wepy.request({
    url: host + '/' + 'authorizations/current',
    method: 'DELETE',
    header: {
      'Authorization': 'Bearer ' + accessToken
    }
  })

    // 调用接口成功则清空缓存
  if (logoutResponse.statusCode === 204) {
    wepy.clearStorage()
  }

  return logoutResponse
}

const updateFile = async (options = {}) => {
  // 显示loading
  wepy.showLoading({title: '上传中'})

  // 获取token
  let accessToken = await getToken()

  // 拼接url
  options.url = host + '/' + options.url
  let header = options.header || {}

  // 将token设置在header中
  header.Authorization = 'Bearer' + accessToken
  options.header = header

  // 上传文件
  let response = await wepy.uploadFile(options)

  // 隐藏loading
  wepy.hideLoading()

  return response
}

export default {
  request,
  login,
  refreshToken,
  authRequest,
  logout,
  updateFile
}