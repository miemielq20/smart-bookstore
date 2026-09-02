<template>
  <div class="categories-page">
    <div class="page-title">
      <div>
        <h2>分类管理</h2>
        <div class="sub">维护图书分类名称、排序和启用状态</div>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">新增分类</el-button>
    </div>

    <SearchPanel :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="关键词">
        <el-input
          v-model.trim="query.keyword"
          clearable
          placeholder="分类名称"
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
        :data="categories"
        row-key="id"
        class="categories-table"
        empty-text="暂无分类数据"
      >
        <el-table-column prop="name" label="分类名称" min-width="180" align="left">
          <template #default="{ row }">
            <div class="category-name">
              <el-icon><Collection /></el-icon>
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="180" align="center" />
        <el-table-column prop="bookCount" label="图书数量" width="180" align="center">
          <template #default="{ row }">
            <el-tag effect="plain">{{ row.bookCount }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="180" align="center">
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
        <el-table-column label="更新时间" width="240" align="center">
          <template #default="{ row }">{{ formatDate(row.updatedAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center">
          <template #default="{ row }">
            <el-button size="small" :icon="Edit" @click="openEditDialog(row)">编辑</el-button>
            <!-- <el-button size="small" type="danger" plain :icon="Delete" @click="handleDelete(row)">
              删除
            </el-button> -->
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
          @size-change="loadCategories"
          @current-change="loadCategories"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新增分类' : '编辑分类'"
      width="480px"
      destroy-on-close
      class="category-dialog"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="84px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model.trim="form.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" :step="1" controls-position="right" />
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model.trim="form.icon" placeholder="可选，填写图标标识" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio-button :label="1">启用</el-radio-button>
            <el-radio-button :label="0">禁用</el-radio-button>
          </el-radio-group>
        </el-form-item>
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
import { Collection, Delete, Edit, Plus, Search } from '@element-plus/icons-vue'
import SearchPanel from '@/components/common/SearchPanel.vue'
import {
  addCategoryApi,
  deleteCategoryApi,
  getCategoriesApi,
  updateCategoryApi,
  updateCategoryStatusApi,
} from '@/api/api'
import type { CategoryFormParams, CategoryQueryParams } from '@/type/api.request'
import type { CategoryItem } from '@/type/category'

type DialogMode = 'create' | 'edit'

interface CategoryFormState {
  id?: number
  name: string
  sort: number
  icon: string
  status: number
}

const loading = ref(false)
const saving = ref(false)
const statusLoadingId = ref<number | null>(null)
const categories = ref<CategoryItem[]>([])
const total = ref(0)
const dialogVisible = ref(false)
const dialogMode = ref<DialogMode>('create')
const formRef = ref<FormInstance>()

const query = reactive<CategoryQueryParams>({
  page: 1,
  pageSize: 10,
  keyword: '',
  status: undefined,
})

const form = reactive<CategoryFormState>({
  name: '',
  sort: 0,
  icon: '',
  status: 1,
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
  sort: [{ required: true, message: '请输入排序值', trigger: 'change' }],
}

const cleanQuery = computed(() => ({
  page: query.page,
  pageSize: query.pageSize,
  keyword: query.keyword || undefined,
  status: query.status,
}))

onMounted(() => {
  loadCategories()
})

async function loadCategories() {
  loading.value = true
  try {
    const res = await getCategoriesApi(cleanQuery.value)
    categories.value = res.data.list
    total.value = res.data.total
    query.page = res.data.page
    query.pageSize = res.data.pageSize
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.page = 1
  loadCategories()
}

function handleReset() {
  query.page = 1
  query.pageSize = 10
  query.keyword = ''
  query.status = undefined
  loadCategories()
}

function openCreateDialog() {
  dialogMode.value = 'create'
  resetForm()
  dialogVisible.value = true
}

function openEditDialog(row: CategoryItem) {
  dialogMode.value = 'edit'
  resetForm()
  form.id = row.id
  form.name = row.name
  form.sort = row.sort
  form.icon = row.icon ?? ''
  form.status = row.status
  dialogVisible.value = true
}

function resetForm() {
  form.id = undefined
  form.name = ''
  form.sort = 0
  form.icon = ''
  form.status = 1
  formRef.value?.clearValidate()
}

async function handleSave() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    const payload = buildPayload()
    if (dialogMode.value === 'create') {
      await addCategoryApi(payload)
      ElMessage.success('新增成功')
    } else if (form.id) {
      await updateCategoryApi(form.id, payload)
      ElMessage.success('保存成功')
    }
    dialogVisible.value = false
    loadCategories()
  } finally {
    saving.value = false
  }
}

async function handleStatusChange(row: CategoryItem, value: boolean) {
  const nextStatus = value ? 1 : 0
  const actionText = nextStatus === 1 ? '启用' : '禁用'

  try {
    await ElMessageBox.confirm(`确定要${actionText}“${row.name}”吗？`, '状态切换', {
      confirmButtonText: actionText,
      cancelButtonText: '取消',
      type: 'warning',
    })
    statusLoadingId.value = row.id
    await updateCategoryStatusApi(row.id, nextStatus)
    ElMessage.success(`${actionText}成功`)
    row.status = nextStatus
  } catch {
    loadCategories()
  } finally {
    statusLoadingId.value = null
  }
}

//删除分类
async function handleDelete(row: CategoryItem) {
  try {
    await ElMessageBox.confirm(`确定要删除“${row.name}”吗？`, '删除分类', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'el-button--danger',
    })
    await deleteCategoryApi(row.id)
    ElMessage.success('删除成功')
    loadCategories()
  } catch {
    // 用户取消或接口拦截时，保留当前列表状态。
  }
}

function buildPayload(): CategoryFormParams {
  return {
    name: form.name,
    sort: Number(form.sort),
    icon: form.icon || undefined,
    status: Number(form.status),
  }
}

function formatDate(value: string) {
  if (!value) return '-'
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}
</script>

<style lang="scss" scoped>
.categories-page {
  color: #2c2416;
  min-width: 0;
  overflow-x: hidden;
}

.table-card {
  border: 1px solid rgba(96, 108, 56, 0.12);
  border-radius: 8px;
  /* 页面内背景统一使用淡米白，和后台整体视觉保持一致 */
  background: #faf7f1;
}

.categories-table {
  --el-table-bg-color: #faf7f1;
  --el-table-tr-bg-color: #faf7f1;
  --el-table-header-bg-color: #faf7f1;
  --el-table-row-hover-bg-color: rgba(139, 157, 131, 0.18);
  --el-table-border-color: rgba(96, 108, 56, 0.14);
  border-radius: 8px;
  overflow: hidden;
}

.categories-table :deep(.el-table__cell),
.categories-table :deep(.cell) {
  min-width: 0;
}

.category-name {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 100%;
  font-weight: 700;
  color: #2c2416;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.pager-row {
  display: flex;
  justify-content: flex-end;
  padding-top: 18px;
}

.category-dialog {
  :deep(.el-dialog) {
    border-radius: 8px;
  }

  :deep(.el-input-number) {
    width: 100%;
  }
}

@media (max-width: 760px) {
  .pager-row {
    justify-content: flex-start;
    overflow-x: auto;
  }
}
</style>
