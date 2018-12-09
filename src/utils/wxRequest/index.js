import Base from './base'
import Host from '@/utils/host'
const Get = async (url, params, options = {}) => await Base.doRequest(`${Host.url}/${url}`, 'GET', params, options)
const Put = async (url, params, options = {}) => await Base.doRequest(`${Host.url}/${url}`, 'PUT', params, options)
const Post = async (url, params, options = {}) => await Base.doRequest(`${Host.url}/${url}`, 'Post', params, options)
const Destroy = async (url, params, options = {}) => await Base.doRequest(`${Host.url}/${url}`, 'DELETE', params, options)
const Upload = async (filePath, params = {}) => await Base.wxUpload(`${Host.url}/upload`, filePath, params)
export default {
  Get,
  Put,
  Post,
  Destroy,
  Upload
}