// NOTE：Taro 的 View 不支持自定义属性，比如 <View theme='test'></View>，编译会过滤掉 theme 属性
// https://github.com/NervJS/taro/issues/11530#issuecomment-2196396686
export default ctx => {
  ctx.registerMethod({
    name: 'onSetupClose',
    fn(platform) {
      const template = platform.template
      template.mergeComponents(ctx, {
        View: {
          'data-theme-name': 'i.dataThemeName'
        }
      })
    }
  })
}