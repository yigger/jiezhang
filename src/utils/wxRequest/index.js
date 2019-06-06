import Base from './base'
import Host from '@/utils/host'
const Get = async (url, params, options = {}) => await Base.doRequest(`${Host.url}/${url}`, 'GET', params, options)
const Put = async (url, params, options = {}) => await Base.doRequest(`${Host.url}/${url}`, 'PUT', params, options)
const Post = async (url, params, options = {}) => await Base.doRequest(`${Host.url}/${url}`, 'Post', params, options)
const Destroy = async (url, params, options = {}) => await Base.doRequest(`${Host.url}/${url}`, 'DELETE', params, options)
const Upload = async (filePath, params = {}) => await Base.wxUpload(`${Host.url}/upload`, filePath, params)

const GetBasic = (url, params, options = {}, callback) => Base.doRequest(`${Host.url}/${url}`, 'GET', params, options, callback)
const PostBasic = (url, params, options = {}, callback) => Base.doRequest(`${Host.url}/${url}`, 'Post', params, options, callback)

const WX = (url, params, callback) => {
  wx.request({
    url: `${Host.host}/${url}`,
    success: (data) => callback(data)
  });
}
export default {
  Get,
  Put,
  Post,
  Destroy,
  PostBasic,
  GetBasic,
  WX,
  Upload
}