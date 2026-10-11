module.exports = {
  projectname: "jz-taro-development",
  outputRoot: `dist/development/${process.env.TARO_ENV || 'weapp'}`,
  env: {
    NODE_ENV: '"development"'
  },
  defineConstants: {
  },
  mini: {},
  h5: {
    esnextModules: ['taro-ui'],
    devServer: {
      host: '127.0.0.1',
      port: 10086,
      open: false,
      proxy: [
        {
          context: ['/api', '/public', '/uploads', '/logo.png'],
          target: process.env.JZ_API_PROXY_TARGET || 'http://127.0.0.1:10240',
          changeOrigin: true
        }
      ]
    }
  }
}
