<template>
  <div class="banners-page">
    <div class="page-title">
      <div>
        <h2>Banner管理</h2>
        <div class="sub">维护首页轮播图、跳转方式和展示状态</div>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">新增 Banner</el-button>
    </div>

    <SearchPanel :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="关键词">
        <el-input
          v-model.trim="query.keyword"
          clearable
          placeholder="Banner 标题"
          :prefix-icon="Search"
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" clearable placeholder="全部状态" style="width: 140px">
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
      </el-form-item>
    </SearchPanel>

    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="banners"
        row-key="id"
        class="banners-table"
        empty-text="暂无 Banner 数据"
      >
        <el-table-column label="Banner" min-width="420">
          <template #default="{ row }">
            <div class="banner-cell">
              <el-image
                class="banner-image"
                :src="row.imageUrl"
                fit="cover"
                :preview-src-list="[row.imageUrl]"
                preview-teleported
              />
              <div class="banner-meta">
                <div class="banner-title">{{ row.title }}</div>
                <div class="banner-link">{{ formatLink(row) }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="链接类型" width="150" align="center">
          <template #default="{ row }">
            <el-tag effect="plain">{{ getLinkTypeLabel(row.linkType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="120" align="center" />
        <el-table-column label="状态" width="150" align="center">
          <template #default="{ row }">
            <el-switch
              :model-value="row.status === 1"
              :loading="statusLoadingId === row.id"
              active-text="启用"
              inactive-text="禁用"
              inline-prompt
              @change="(value: boolean) => handleStatusChange(row, value)"
            />
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="180" align="center">
          <template #default="{ row }">{{ formatDate(row.updatedAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="190" align="center">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button size="small" :icon="Edit" @click="openEditDialog(row)">编辑</el-button>
              <el-button size="small" type="danger" plain :icon="Delete" @click="handleDelete(row)">
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pager-row">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="loadBanners"
          @current-change="loadBanners"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新增 Banner' : '编辑 Banner'"
      width="640px"
      destroy-on-close
      class="banner-dialog"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="92px">
        <el-form-item label="标题" prop="title">
          <el-input v-model.trim="form.title" placeholder="请输入 Banner 标题" />
        </el-form-item>
        <el-form-item label="图片 URL" prop="imageUrl">
          <el-input v-model.trim="form.imageUrl" placeholder="https://..." />
        </el-form-item>
        <el-form-item label="链接类型" prop="linkType">
          <el-select v-model="form.linkType" class="full-form-control" @change="handleLinkTypeChange">
            <el-option label="图书" value="BOOK" />
            <el-option label="分类" value="CATEGORY" />
            <el-option label="URL" value="URL" />
            <el-option label="无跳转" value="NONE" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.linkType === 'URL'" label="链接地址" prop="linkUrl">
          <el-input v-model.trim="form.linkUrl" placeholder="https://..." />
        </el-form-item>
        <el-form-item v-if="form.linkType === 'BOOK' || form.linkType === 'CATEGORY'" label="目标 ID" prop="targetId">
          <el-input-number v-model="form.targetId" :min="1" :step="1" controls-position="right" />
        </el-form-item>
        <div class="form-grid">
          <el-form-item label="排序" prop="sort">
            <el-input-number v-model="form.sort" :min="0" :step="1" controls-position="right" />
          </el-form-item>
          <el-form-item label="状态">
            <el-radio-group v-model="form.status">
              <el-radio-button :label="1">启用</el-radio-button>
              <el-radio-button :label="0">禁用</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Delete, Edit, Plus, Search } from '@element-plus/icons-vue'
import SearchPanel from '@/components/common/SearchPanel.vue'
import {
  addBannerApi,
  deleteBannerApi,
  getBannersApi,
  updateBannerApi,
  updateBannerStatusApi,
} from '@/api/api'
import type { BannerFormParams, BannerQueryParams } from '@/type/api.request'
import type { BannerItem, BannerLinkType } from '@/type/banner'

type DialogMode = 'create' | 'edit'

interface BannerFormState {
  id?: number
  title: string
  imageUrl: string
  linkUrl: string
  linkType: BannerLinkType
  targetId?: number
  sort: number
  status: number
}

const linkTypeMap: Record<BannerLinkType, string> = {
  BOOK: '图书',
  CATEGORY: '分类',
  URL: 'URL',
  NONE: '无跳转',
}

const loading = ref(false)
const saving = ref(false)
const statusLoadingId = ref<number | null>(null)
const banners = ref<BannerItem[]>([])
const total = ref(0)
const dialogVisible = ref(false)
const dialogMode = ref<DialogMode>('create')
const formRef = ref<FormInstance>()

const query = reactive<BannerQueryParams>({
  page: 1,
  pageSize: 10,
  keyword: '',
  status: undefined,
})

const form = reactive<BannerFormState>({
  title: '',
  imageUrl: '',
  linkUrl: '',
  linkType: 'NONE',
  targetId: undefined,
  sort: 0,
  status: 1,
})

const rules: FormRules = {
  title: [{ required: true, message: '请输入 Banner 标题', trigger: 'blur' }],
  imageUrl: [{ required: true, message: '请输入图片 URL', trigger: 'blur' }],
  linkType: [{ required: true, message: '请选择链接类型', trigger: 'change' }],
  sort: [{ required: true, message: '请输入排序值', trigger: 'change' }],
}

const cleanQuery = computed(() => ({
  page: query.page,
  pageSize: query.pageSize,
  keyword: query.keyword || undefined,
  status: query.status,
}))

onMounted(() => {
  loadBanners()
})

async function loadBanners() {
  loading.value = true
  try {
    const res = await getBannersApi(cleanQuery.value)
    banners.value = res.data.list
    total.value = res.data.total
    query.page = res.data.page
    query.pageSize = res.data.pageSize
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.page = 1
  loadBanners()
}

function handleReset() {
  query.page = 1
  query.pageSize = 10
  query.keyword = ''
  query.status = undefined
  loadBanners()
}

function openCreateDialog() {
  dialogMode.value = 'create'
  resetForm()
  dialogVisible.value = true
}

function openEditDialog(row: BannerItem) {
  dialogMode.value = 'edit'
  resetForm()
  form.id = row.id
  form.title = row.title
  form.imageUrl = row.imageUrl
  form.linkUrl = row.linkUrl ?? ''
  form.linkType = row.linkType
  form.targetId = row.targetId ?? undefined
  form.sort = row.sort
  form.status = row.status
  dialogVisible.value = true
}

function resetForm() {
  form.id = undefined
  form.title = ''
  form.imageUrl = ''
  form.linkUrl = ''
  form.linkType = 'NONE'
  form.targetId = undefined
  form.sort = 0
  form.status = 1
  formRef.value?.clearValidate()
}

function handleLinkTypeChange() {
  // 切换链接类型时清理互斥字段，避免保存到错误的跳转目标。
  if (form.linkType === 'URL') {
    form.targetId = undefined
  } else if (form.linkType === 'BOOK' || form.linkType === 'CATEGORY') {
    form.linkUrl = ''
  } else {
    form.linkUrl = ''
    form.targetId = undefined
  }
}

async function handleSave() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  if (!validateLinkTarget()) return

  saving.value = true
  try {
    const payload = buildPayload()
    if (dialogMode.value === 'create') {
      await addBannerApi(payload)
      ElMessage.success('新增成功')
    } else if (form.id) {
      await updateBannerApi(form.id, payload)
      ElMessage.success('保存成功')
    }
    dialogVisible.value = false
    loadBanners()
  } finally {
    saving.value = false
  }
}

async function handleStatusChange(row: BannerItem, value: boolean) {
  const nextStatus = value ? 1 : 0
  const actionText = nextStatus === 1 ? '启用' : '禁用'

  try {
    await ElMessageBox.confirm(`确定要${actionText}“${row.title}”吗？`, '状态切换', {
      confirmButtonText: actionText,
      cancelButtonText: '取消',
      type: 'warning',
    })
    statusLoadingId.value = row.id
    await updateBannerStatusApi(row.id, nextStatus)
    ElMessage.success(`${actionText}成功`)
    row.status = nextStatus
  } catch {
    loadBanners()
  } finally {
    statusLoadingId.value = null
  }
}

async function handleDelete(row: BannerItem) {
  try {
    await ElMessageBox.confirm(`确定要删除“${row.title}”吗？`, '删除 Banner', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'el-button--danger',
    })
    await deleteBannerApi(row.id)
    ElMessage.success('删除成功')
    loadBanners()
  } catch {
    // 用户取消删除或接口拦截时，保留当前列表状态。
  }
}

function validateLinkTarget() {
  if (form.linkType === 'URL' && !form.linkUrl) {
    ElMessage.warning('URL 类型需要填写链接地址')
    return false
  }
  if ((form.linkType === 'BOOK' || form.linkType === 'CATEGORY') && !form.targetId) {
    ElMessage.warning('图书或分类类型需要填写目标 ID')
    return false
  }
  return true
}

function buildPayload(): BannerFormParams {
  return {
    title: form.title,
    imageUrl: form.imageUrl,
    linkType: form.linkType,
    linkUrl: form.linkType === 'URL' ? form.linkUrl : undefined,
    targetId: form.linkType === 'BOOK' || form.linkType === 'CATEGORY' ? Number(form.targetId) : undefined,
    sort: Number(form.sort),
    status: Number(form.status),
  }
}

function formatLink(row: BannerItem) {
  if (row.linkType === 'URL') return row.linkUrl || '-'
  if (row.linkType === 'BOOK') return `图书 ID：${row.targetId ?? '-'}`
  if (row.linkType === 'CATEGORY') return `分类 ID：${row.targetId ?? '-'}`
  return '无跳转'
}

function getLinkTypeLabel(linkType: BannerLinkType) {
  return linkTypeMap[linkType]
}

function formatDate(value: string) {
  if (!value) return '-'
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}
</script>

<style lang="scss" scoped>
.banners-page {
  color: #2c2416;
  min-width: 0;
  overflow-x: hidden;
}

.table-card {
  border: 1px solid rgba(96, 108, 56, 0.12);
  border-radius: 8px;
  /* 页面内背景统一使用 #faf7f1，和后台整体视觉保持一致 */
  background: #faf7f1;
}

.banners-table {
  --el-table-bg-color: #faf7f1;
  --el-table-tr-bg-color: #faf7f1;
  --el-table-header-bg-color: #faf7f1;
  --el-table-row-hover-bg-color: rgba(139, 157, 131, 0.18);
  --el-table-border-color: rgba(96, 108, 56, 0.14);
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.banners-table :deep(.el-table__cell),
.banners-table :deep(.cell) {
  min-width: 0;
}

.banner-cell {
  display: flex;
  align-items: center;
  gap: 18px;
  min-width: 0;
  width: 100%;
}

.banner-image {
  width: 180px;
  height: 72px;
  border-radius: 4px;
  background: #e8dcc7;
  flex-shrink: 0;
}

.banner-meta {
  min-width: 0;
  flex: 1;
}

.banner-title {
  font-size: 14px;
  font-weight: 700;
  color: #2c2416;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.banner-link {
  margin-top: 5px;
  font-size: 12px;
  color: #7a6e5e;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.table-actions {
  display: inline-flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
}

.table-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.pager-row {
  display: flex;
  justify-content: flex-end;
  padding-top: 18px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 10px;
}

.full-form-control {
  width: 100%;
}

.banner-dialog {
  :deep(.el-dialog) {
    border-radius: 8px;
  }

  :deep(.el-input-number) {
    width: 100%;
  }
}

@media (max-width: 760px) {
  .form-grid {
    display: block;
  }

  .pager-row {
    justify-content: flex-start;
    overflow-x: auto;
  }
}
</style>
