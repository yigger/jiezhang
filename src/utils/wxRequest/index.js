import Base from './base'
import Host from '@/utils/host'
const Get = async (url, params) => await Base.doRequest(`${Host.url}/${url}`, 'GET', params)
const Put = async (url, params) => await Base.doRequest(`${Host.url}/${url}`, 'PUT', params)
const Post = async (url, params) => await Base.doRequest(`${Host.url}/${url}`, 'Post', params)
const Destroy = async (url, params) => await Base.doRequest(`${Host.url}/${url}`, 'DELETE', params)
const Upload = async (url, params) => await Base.wxUpload(`${Host.url}/${url}`, params)
export default {
  Get,
  Put,
  Post,
  Destroy,
  Upload
}