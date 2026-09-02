<template>
  <view class="page">
    <u-navbar
      title=""
      :bg-color="theme.page"
      :border="false"
      :placeholder="true"
      :safe-area-inset-top="true"
    />
    <view class="topline">
      <view class="back" @tap="back"><u-icon name="arrow-left" color="#FFFDF7" size="21" /></view>
      <view><text class="title">收货地址</text><text class="sub">默认地址用于订单快照</text></view>
      <view class="add" @tap="openCreate"><u-icon name="plus" color="#606C38" size="22" /></view>
    </view>
    <view v-if="loading" class="loading"><u-loading-icon color="#606C38" /></view>
    <u-empty v-else-if="!addresses.length" mode="address" text="还没有收货地址" margin-top="120" />
    <view v-else class="address-list">
      <view v-for="item in addresses" :key="item.id" class="address-card">
        <view class="address-main">
          <view class="address-icon"><u-icon name="map" color="#C66B3D" size="22" /></view>
          <view class="address-copy">
            <view class="person"
              ><text>{{ item.receiverName }}</text
              ><text>{{ item.receiverPhone }}</text
              ><text v-if="item.isDefault" class="default-tag">默认地址</text></view
            ><text class="address-text">{{ fullAddress(item) }}</text>
          </view>
        </view>
        <view class="address-actions"
          ><text v-if="!item.isDefault" class="action" @tap="setDefault(item.id)">设为默认</text
          ><text class="action" @tap="openEdit(item)">编辑</text
          ><text class="action delete" @tap="remove(item.id)">删除</text></view
        >
      </view>
    </view>
    <u-popup :show="formVisible" mode="bottom" :round="22" @close="formVisible = false">
      <view class="form">
        <view class="form-head"
          ><text>{{ editingId ? '编辑地址' : '新增地址' }}</text
          ><u-icon name="close" color="#7A6E5E" size="20" @tap="formVisible = false" /></view
        ><u-input v-model="form.receiverName" placeholder="收货人姓名" border="bottom" /><u-input
          v-model="form.receiverPhone"
          placeholder="联系电话"
          border="bottom"
        />
        <view class="region-picker" @tap="openRegionPicker"
          ><text :class="{ placeholder: !regionSelected }">{{
            regionSelected
              ? `${form.province} / ${form.city} / ${form.district}`
              : '请选择省 / 市 / 县'
          }}</text
          ><u-icon name="arrow-down" color="#A0927F" size="16" /></view
        ><u-input v-model="form.detail" placeholder="详细地址" border="bottom" />
        <view class="default-row" @tap="form.isDefault = form.isDefault ? 0 : 1">
          <view class="check" :class="{ checked: form.isDefault }"
            ><u-icon v-if="form.isDefault" name="checkmark" color="#7A7A7A" size="15" /></view
          ><text>设为默认地址</text> </view
        ><u-button color="#24433B" :loading="saving" text="保存地址" @click="save" />
      </view>
    </u-popup>
    <u-picker
      :show="regionVisible"
      :columns="regionColumns"
      :default-index="regionDraftIndex"
      title="选择地区"
      cancel-text="取消"
      confirm-text="完成"
      @cancel="regionVisible = false"
      @close="regionVisible = false"
      @change="changeRegionDraft"
      @confirm="confirmRegion"
    />
  </view>
</template>
<script lang="ts" setup>
import { onShow } from '@dcloudio/uni-app'
import { computed, reactive, ref } from 'vue'
// 行政区数据随前端打包，保证 H5、App 和小程序使用同一份省市县数据。
// @ts-ignore JSON data package has no declaration file.
import areaData from 'china-area-data/data-array.json'
import {
  createAddressApi,
  getAddressesApi,
  removeAddressApi,
  setDefaultAddressApi,
  updateAddressApi,
} from '../../services/bookstore'
import type { Address } from '../../types/address'
const theme = { page: '#F8F4EA' }
const addresses = ref<Address[]>([])
const loading = ref(true)
const saving = ref(false)
const formVisible = ref(false)
const editingId = ref(0)
const regionVisible = ref(false)
const provinceOptions = [
  '北京市',
  '天津市',
  '上海市',
  '重庆市',
  '河北省',
  '山西省',
  '辽宁省',
  '吉林省',
  '黑龙江省',
  '江苏省',
  '浙江省',
  '安徽省',
  '福建省',
  '江西省',
  '山东省',
  '河南省',
  '湖北省',
  '湖南省',
  '广东省',
  '海南省',
  '四川省',
  '贵州省',
  '云南省',
  '陕西省',
  '甘肃省',
  '青海省',
  '台湾省',
  '内蒙古自治区',
  '广西壮族自治区',
  '西藏自治区',
  '宁夏回族自治区',
  '新疆维吾尔自治区',
  '香港特别行政区',
  '澳门特别行政区',
]
const cityMap: Record<string, string[]> = {
  北京市: ['北京市'],
  天津市: ['天津市'],
  上海市: ['上海市'],
  重庆市: ['重庆市'],
  河北省: [
    '石家庄市',
    '唐山市',
    '秦皇岛市',
    '邯郸市',
    '保定市',
    '张家口市',
    '承德市',
    '沧州市',
    '廊坊市',
    '衡水市',
  ],
  山西省: [
    '太原市',
    '大同市',
    '阳泉市',
    '长治市',
    '晋城市',
    '朔州市',
    '晋中市',
    '运城市',
    '忻州市',
    '临汾市',
    '吕梁市',
  ],
  辽宁省: [
    '沈阳市',
    '大连市',
    '鞍山市',
    '抚顺市',
    '本溪市',
    '丹东市',
    '锦州市',
    '营口市',
    '阜新市',
    '辽阳市',
    '盘锦市',
    '铁岭市',
    '朝阳市',
    '葫芦岛市',
  ],
  吉林省: [
    '长春市',
    '吉林市',
    '四平市',
    '辽源市',
    '通化市',
    '白山市',
    '松原市',
    '白城市',
    '延边朝鲜族自治州',
  ],
  黑龙江省: [
    '哈尔滨市',
    '齐齐哈尔市',
    '鸡西市',
    '鹤岗市',
    '双鸭山市',
    '大庆市',
    '伊春市',
    '佳木斯市',
    '七台河市',
    '牡丹江市',
    '黑河市',
    '绥化市',
    '大兴安岭地区',
  ],
  江苏省: [
    '南京市',
    '无锡市',
    '徐州市',
    '常州市',
    '苏州市',
    '南通市',
    '连云港市',
    '淮安市',
    '盐城市',
    '扬州市',
    '镇江市',
    '泰州市',
    '宿迁市',
  ],
  浙江省: [
    '杭州市',
    '宁波市',
    '温州市',
    '嘉兴市',
    '湖州市',
    '绍兴市',
    '金华市',
    '衢州市',
    '舟山市',
    '台州市',
    '丽水市',
  ],
  安徽省: [
    '合肥市',
    '芜湖市',
    '蚌埠市',
    '淮南市',
    '马鞍山市',
    '淮北市',
    '铜陵市',
    '安庆市',
    '黄山市',
    '滁州市',
    '阜阳市',
    '宿州市',
    '六安市',
    '亳州市',
    '池州市',
    '宣城市',
  ],
  福建省: [
    '福州市',
    '厦门市',
    '莆田市',
    '三明市',
    '泉州市',
    '漳州市',
    '南平市',
    '龙岩市',
    '宁德市',
  ],
  江西省: [
    '南昌市',
    '景德镇市',
    '萍乡市',
    '九江市',
    '新余市',
    '鹰潭市',
    '赣州市',
    '吉安市',
    '宜春市',
    '抚州市',
    '上饶市',
  ],
  山东省: [
    '济南市',
    '青岛市',
    '淄博市',
    '枣庄市',
    '东营市',
    '烟台市',
    '潍坊市',
    '济宁市',
    '泰安市',
    '威海市',
    '日照市',
    '临沂市',
    '德州市',
    '聊城市',
    '滨州市',
    '菏泽市',
  ],
  河南省: [
    '郑州市',
    '开封市',
    '洛阳市',
    '平顶山市',
    '安阳市',
    '鹤壁市',
    '新乡市',
    '焦作市',
    '濮阳市',
    '许昌市',
    '漯河市',
    '三门峡市',
    '南阳市',
    '商丘市',
    '信阳市',
    '周口市',
    '驻马店市',
  ],
  湖北省: [
    '武汉市',
    '黄石市',
    '十堰市',
    '宜昌市',
    '襄阳市',
    '鄂州市',
    '荆门市',
    '孝感市',
    '荆州市',
    '黄冈市',
    '咸宁市',
    '随州市',
    '恩施土家族苗族自治州',
  ],
  湖南省: [
    '长沙市',
    '株洲市',
    '湘潭市',
    '衡阳市',
    '邵阳市',
    '岳阳市',
    '常德市',
    '张家界市',
    '益阳市',
    '郴州市',
    '永州市',
    '怀化市',
    '娄底市',
    '湘西土家族苗族自治州',
  ],
  广东省: [
    '广州市',
    '韶关市',
    '深圳市',
    '珠海市',
    '汕头市',
    '佛山市',
    '江门市',
    '湛江市',
    '茂名市',
    '肇庆市',
    '惠州市',
    '梅州市',
    '汕尾市',
    '河源市',
    '阳江市',
    '清远市',
    '东莞市',
    '中山市',
    '潮州市',
    '揭阳市',
    '云浮市',
  ],
  海南省: ['海口市', '三亚市', '三沙市', '儋州市'],
  四川省: [
    '成都市',
    '自贡市',
    '攀枝花市',
    '泸州市',
    '德阳市',
    '绵阳市',
    '广元市',
    '遂宁市',
    '内江市',
    '乐山市',
    '南充市',
    '眉山市',
    '宜宾市',
    '广安市',
    '达州市',
    '雅安市',
    '巴中市',
    '资阳市',
    '阿坝藏族羌族自治州',
    '甘孜藏族自治州',
    '凉山彝族自治州',
  ],
  贵州省: [
    '贵阳市',
    '六盘水市',
    '遵义市',
    '安顺市',
    '毕节市',
    '铜仁市',
    '黔西南布依族苗族自治州',
    '黔东南苗族侗族自治州',
    '黔南布依族苗族自治州',
  ],
  云南省: [
    '昆明市',
    '曲靖市',
    '玉溪市',
    '保山市',
    '昭通市',
    '丽江市',
    '普洱市',
    '临沧市',
    '楚雄彝族自治州',
    '红河哈尼族彝族自治州',
    '文山壮族苗族自治州',
    '西双版纳傣族自治州',
    '大理白族自治州',
    '德宏傣族景颇族自治州',
    '怒江傈僳族自治州',
    '迪庆藏族自治州',
  ],
  陕西省: [
    '西安市',
    '铜川市',
    '宝鸡市',
    '咸阳市',
    '渭南市',
    '延安市',
    '汉中市',
    '榆林市',
    '安康市',
    '商洛市',
  ],
  甘肃省: [
    '兰州市',
    '嘉峪关市',
    '金昌市',
    '白银市',
    '天水市',
    '武威市',
    '张掖市',
    '平凉市',
    '酒泉市',
    '庆阳市',
    '定西市',
    '陇南市',
    '临夏回族自治州',
    '甘南藏族自治州',
  ],
  青海省: [
    '西宁市',
    '海东市',
    '海北藏族自治州',
    '黄南藏族自治州',
    '海南藏族自治州',
    '果洛藏族自治州',
    '玉树藏族自治州',
    '海西蒙古族藏族自治州',
  ],
  台湾省: ['台北市', '新北市', '桃园市', '台中市', '台南市', '高雄市'],
  内蒙古自治区: [
    '呼和浩特市',
    '包头市',
    '乌海市',
    '赤峰市',
    '通辽市',
    '鄂尔多斯市',
    '呼伦贝尔市',
    '巴彦淖尔市',
    '乌兰察布市',
    '兴安盟',
    '锡林郭勒盟',
    '阿拉善盟',
  ],
  广西壮族自治区: [
    '南宁市',
    '柳州市',
    '桂林市',
    '梧州市',
    '北海市',
    '防城港市',
    '钦州市',
    '贵港市',
    '玉林市',
    '百色市',
    '贺州市',
    '河池市',
    '来宾市',
    '崇左市',
  ],
  西藏自治区: ['拉萨市', '日喀则市', '昌都市', '林芝市', '山南市', '那曲市', '阿里地区'],
  宁夏回族自治区: ['银川市', '石嘴山市', '吴忠市', '固原市', '中卫市'],
  新疆维吾尔自治区: [
    '乌鲁木齐市',
    '克拉玛依市',
    '吐鲁番市',
    '哈密市',
    '昌吉回族自治州',
    '博尔塔拉蒙古自治州',
    '巴音郭楞蒙古自治州',
    '阿克苏地区',
    '克孜勒苏柯尔克孜自治州',
    '喀什地区',
    '和田地区',
    '伊犁哈萨克自治州',
    '塔城地区',
    '阿勒泰地区',
  ],
  香港特别行政区: ['香港特别行政区'],
  澳门特别行政区: ['澳门特别行政区'],
}
const cityOptions = ref<string[]>([])
const districtOptions = ref<string[]>(['市辖区', '其他区县'])
const regionDraftIndex = ref([0, 0, 0])
const regionSelected = ref(false)
const regionColumns = computed(() => [provinceOptions, cityOptions.value, districtOptions.value])
const form = reactive({
  receiverName: '',
  receiverPhone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  isDefault: 0,
})
type AreaItem = { name: string; value: string; parent?: string }
const areaItems = areaData as AreaItem[]
const provinceItems = areaItems.filter((item) => !item.parent)
const districtMap: Record<string, string[]> = {}
Object.keys(cityMap).forEach((key) => delete cityMap[key])
provinceItems.forEach((province) => {
  const cities = areaItems.filter((item) => item.parent === province.value)
  cityMap[province.name] = cities.map((city) => city.name)
  cities.forEach((city) => {
    districtMap[`${province.name}|${city.name}`] = areaItems
      .filter((item) => item.parent === city.value)
      .map((item) => item.name)
  })
})
provinceOptions.splice(0, provinceOptions.length, ...provinceItems.map((item) => item.name))
onShow(load)
async function load() {
  loading.value = true
  try {
    addresses.value = (await getAddressesApi()).data
  } finally {
    loading.value = false
  }
}
function districtsFor(province: string, city: string) {
  return districtMap[`${province}|${city}`] || []
}
function reset() {
  Object.assign(form, {
    receiverName: '',
    receiverPhone: '',
    province: '',
    city: '',
    district: '',
    detail: '',
    isDefault: 0,
  })
  cityOptions.value = cityMap[provinceOptions[0]] || []
  districtOptions.value = districtsFor(provinceOptions[0], cityOptions.value[0]) || []
  regionDraftIndex.value = [0, 0, 0]
  regionSelected.value = false
  editingId.value = 0
}
function openCreate() {
  reset()
  formVisible.value = true
}
function openEdit(item: Address) {
  Object.assign(form, item, { isDefault: item.isDefault ? 1 : 0 })
  const province = Math.max(0, provinceOptions.indexOf(item.province))
  cityOptions.value = cityMap[item.province] || []
  const city = Math.max(0, cityOptions.value.indexOf(item.city))
  districtOptions.value = districtsFor(item.province, item.city)
  regionDraftIndex.value = [
    province,
    city,
    Math.max(0, districtOptions.value.indexOf(item.district)),
  ]
  regionSelected.value = true
  editingId.value = item.id
  formVisible.value = true
}
function openRegionPicker() {
  const provinceIndex = Math.max(0, provinceOptions.indexOf(form.province))
  cityOptions.value = cityMap[form.province] || cityMap[provinceOptions[0]] || []
  const cityIndex = Math.max(0, cityOptions.value.indexOf(form.city))
  districtOptions.value =
    districtsFor(form.province || provinceOptions[0], form.city || cityOptions.value[0]) || []
  regionDraftIndex.value = [
    provinceIndex,
    cityIndex,
    Math.max(0, districtOptions.value.indexOf(form.district)),
  ]
  regionVisible.value = true
}
function changeRegionDraft(event: { indexs: number[] }) {
  const indexes = event.indexs || []
  const provinceIndex = Number(indexes[0] || 0)
  const cityIndex = Number(indexes[1] || 0)
  const districtIndex = Number(indexes[2] || 0)
  const previousProvinceIndex = regionDraftIndex.value[0]
  const previousCityIndex = regionDraftIndex.value[1]
  regionDraftIndex.value = [provinceIndex, cityIndex, districtIndex]
  const province = provinceOptions[provinceIndex] || provinceOptions[0]
  const cities = cityMap[province] || []
  if (provinceIndex !== previousProvinceIndex) {
    cityOptions.value = cities
    districtOptions.value = districtsFor(province, cities[0]) || []
    regionDraftIndex.value = [provinceIndex, 0, 0]
  } else if (cityIndex !== previousCityIndex) {
    const city = cities[cityIndex] || cities[0]
    districtOptions.value = districtsFor(province, city) || []
    regionDraftIndex.value = [provinceIndex, cityIndex, 0]
  }
}
function confirmRegion(event: { indexs: number[] }) {
  const indexes = event.indexs || regionDraftIndex.value
  const provinceIndex = Number(indexes[0] || 0)
  const cityIndex = Number(indexes[1] || 0)
  const districtIndex = Number(indexes[2] || 0)
  const province = provinceOptions[provinceIndex] || provinceOptions[0]
  cityOptions.value = cityMap[province] || []
  const city = cityOptions.value[cityIndex] || cityOptions.value[0] || ''
  districtOptions.value = districtsFor(province, city) || []
  form.province = province
  form.city = city
  form.district = districtOptions.value[districtIndex] || districtOptions.value[0] || ''
  regionDraftIndex.value = [provinceIndex, cityIndex, districtIndex]
  regionSelected.value = true
  regionVisible.value = false
}
async function save() {
  if (!form.receiverName || !form.receiverPhone || !form.detail)
    return uni.showToast({ title: '请填写完整地址', icon: 'none' })
  saving.value = true
  try {
    const data = { ...form }
    if (editingId.value) await updateAddressApi(editingId.value, data)
    else await createAddressApi(data)
    await load()
    formVisible.value = false
    uni.showToast({ title: '地址已保存', icon: 'success' })
  } finally {
    saving.value = false
  }
}
async function setDefault(id: number) {
  addresses.value = (await setDefaultAddressApi(id)).data
}
function remove(id: number) {
  uni.showModal({
    title: '删除地址',
    content: '确定要删除这个收货地址吗？',
    confirmText: '确定',
    cancelText: '取消',
    confirmColor: '#E53935',
    cancelColor: '#2F80ED',
    success: async ({ confirm }) => {
      if (confirm) addresses.value = (await removeAddressApi(id)).data
    },
  })
}
function fullAddress(item: Address) {
  return [item.province, item.city, item.district, item.detail].filter(Boolean).join(' ')
}
function back() {
  uni.navigateBack({ delta: 1 })
}
</script>
<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding: 0 28rpx 60rpx;
  background: #f8f4ea;
  color: #2c2416;
}

.topline {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 24rpx 4rpx 30rpx;
}

.back {
  display: flex;
  width: 72rpx;
  height: 72rpx;
  align-items: center;
  justify-content: center;
  border-radius: 24rpx;
  background: #24433b;
}

.title {
  display: block;
  font-family: Georgia, serif;
  font-size: 42rpx;
  font-weight: 700;
}

.sub {
  display: block;
  margin-top: 7rpx;
  color: #7a6e5e;
  font-size: 20rpx;
}

.add {
  display: flex;
  width: 68rpx;
  height: 68rpx;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  border-radius: 50%;
  background: #fffdf7;
}

.loading {
  text-align: center;
  padding-top: 140rpx;
}

.address-card {
  margin-bottom: 18rpx;
  padding: 24rpx;
  border-radius: 22rpx;
  background: #fffdf7;
}

.address-main {
  display: flex;
  gap: 16rpx;
}

.address-icon {
  display: flex;
  width: 54rpx;
  height: 54rpx;
  align-items: center;
  justify-content: center;
  border-radius: 16rpx;
  background: #e8dcc7;
}

.address-copy {
  min-width: 0;
  flex: 1;
}

.person {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.person > text:first-child {
  font-size: 27rpx;
  font-weight: 800;
}

.person > text:nth-child(2) {
  color: #7a6e5e;
  font-size: 22rpx;
}

.default-tag {
  padding: 4rpx 9rpx;
  border-radius: 8rpx;
  color: #c66b3d;
  background: #fff0e7;
  font-size: 17rpx;
}

.address-text {
  display: block;
  margin-top: 10rpx;
  color: #7a6e5e;
  font-size: 21rpx;
  line-height: 1.5;
}

.address-actions {
  display: flex;
  justify-content: flex-end;
  gap: 24rpx;
  margin-top: 20rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid rgba(159, 147, 129, 0.16);
}

.action {
  color: #606c38;
  font-size: 21rpx;
}

.delete {
  color: #c66b3d;
}

.form {
  padding: 26rpx 28rpx calc(30rpx + env(safe-area-inset-bottom));
  background: #f8f4ea;
}

.form-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15rpx;
  font-size: 30rpx;
  font-weight: 800;
}

.form :deep(.u-input) {
  padding: 16rpx 0 !important;
}

.region-picker {
  display: flex;
  min-height: 84rpx;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1rpx solid #e5dcc8;
  color: #2c2416;
  font-size: 24rpx;
}

.region-picker .placeholder {
  color: #a0927f;
}

.default-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin: 22rpx 0;
  color: #7a6e5e;
  font-size: 22rpx;
}

.check {
  display: flex;
  width: 34rpx;
  height: 34rpx;
  align-items: center;
  justify-content: center;
  border: 2rpx solid #cfc4b3;
  border-radius: 50%;
  background: #fffdf7;
}

.check.checked {
  border-color: #9a9a9a;
}

.form .u-button {
  border-radius: 18rpx;
}
</style>
