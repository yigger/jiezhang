import wepy from 'wepy';
import api from "../api/api";
export default class HostMixin extends wepy.mixin {

  computed = {
    host () {
      return api.host
    }
  }
}