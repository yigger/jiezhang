import wepy from 'wepy';
import tip from './tip'

const wxRequest = async(params = {}, url) => {
	tip.loading();
	let data = params.query || {};
	let res = await wepy.request({
		url: url,
		method: params.method || 'GET',
		data: data,
		header: { 'Content-Type': 'application/json' },
	});
	tip.loaded();
	return res;
};


module.exports = {
	wxRequest
}
