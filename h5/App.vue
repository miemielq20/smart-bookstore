<script lang="ts">
export default {
  onLaunch() {
    console.log('App Launch')
  },
  onShow() {
    console.log('App Show')
  },
  onHide() {
    console.log('App Hide')
  },
}	
</script>

<style lang="scss">
@import 'uview-plus/theme.scss';
@import 'uview-plus/index.scss';

page {
  background: #f8f4ea;
  color: #2c2416;
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

view,
text,
button,
input,
textarea {
  box-sizing: border-box;
}
</style>
