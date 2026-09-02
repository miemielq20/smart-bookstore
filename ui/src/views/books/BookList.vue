<template>
  <div class="books-page">
    <div class="page-title">
      <div>
        <h2>图书列表</h2>
        <div class="sub">管理图书库存、价格与上下架状态</div>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">新增图书</el-button>
    </div>

    <SearchPanel :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="关键词">
        <el-input
          v-model.trim="query.keyword"
          clearable
          placeholder="书名 / 作者 / ISBN"
          :prefix-icon="Search"
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item label="分类">
        <el-select
          v-model="query.category"
          clearable
          filterable
          placeholder="全部分类"
          style="width: 180px"
        >
          <el-option
            v-for="category in categories"
            :key="category.id"
            :label="category.name"
            :value="category.name"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" clearable placeholder="全部状态" style="width: 140px">
          <el-option label="上架" :value="1" />
          <el-option label="下架" :value="0" />
        </el-select>
      </el-form-item>
    </SearchPanel>

    <el-card class="table-card" shadow="never">
      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="books"
        row-key="id"
        class="books-table"
        empty-text="暂无图书数据"
      >
        <!-- 直接展示图书在数据库中的主键编号，便于后台定位数据。 -->
        <el-table-column prop="id" label="编号" width="90" align="center" />

        <el-table-column label="图书" min-width="280">
          <template #default="{ row }">
            <div class="book-cell">
              <el-image
                class="book-cover"
                :src="row.coverUrl || defaultCover"
                fit="cover"
                :preview-src-list="[row.coverUrl || defaultCover]"
                preview-teleported
              />
              <div class="book-meta">
                <div class="book-title">{{ row.title }}</div>
                <div class="book-sub">{{ row.author || '未填写作者' }}</div>
                <div class="book-isbn">ISBN：{{ row.isbn || '未填写' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="价格" width="180" align="center">
          <template #default="{ row }">
            <div class="price">¥{{ formatPrice(row.price) }}</div>
            <div v-if="row.originalPrice" class="original-price">¥{{ formatPrice(row.originalPrice) }}</div>
          </template>
        </el-table-column>

        <el-table-column prop="stock" label="库存" width="180" align="center">
          <template #default="{ row }">
            <el-tag :type="row.stock > 0 ? 'success' : 'danger'" effect="plain">
              {{ row.stock }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="salesCount" label="销量" width="120" align="center" />

        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-switch
              :model-value="row.status === 1"
              :loading="statusLoadingId === row.id"
              active-text="上架"
              inactive-text="下架"
              inline-prompt
              @change="(value: boolean) => handleStatusChange(row, value)"
            />
          </template>
        </el-table-column>

        <el-table-column label="更新时间" width="180">
          <template #default="{ row }">{{ formatDate(row.updatedAt) }}</template>
        </el-table-column>

        <el-table-column label="操作" width="260" align="center">
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
          @size-change="loadBooks"
          @current-change="loadBooks"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新增图书' : '编辑图书'"
      width="720px"
      destroy-on-close
      class="book-dialog"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="92px">
        <div class="form-grid">
          <el-form-item label="书名" prop="title">
            <el-input v-model.trim="form.title" placeholder="请输入书名" />
          </el-form-item>
          <el-form-item label="作者" prop="author">
            <el-input v-model.trim="form.author" placeholder="请输入作者" />
          </el-form-item>
          <el-form-item label="ISBN" prop="isbn">
            <el-input v-model.trim="form.isbn" placeholder="请输入 ISBN" />
          </el-form-item>
          <el-form-item label="语言">
            <el-input v-model.trim="form.language" placeholder="中文" />
          </el-form-item>
          <el-form-item label="售价" prop="price">
            <el-input-number v-model="form.price" :min="0" :precision="2" :step="1" controls-position="right" />
          </el-form-item>
          <el-form-item label="原价">
            <el-input-number v-model="form.originalPrice" :min="0" :precision="2" :step="1" controls-position="right" />
          </el-form-item>
          <el-form-item label="库存" prop="stock">
            <el-input-number v-model="form.stock" :min="0" :step="1" controls-position="right" />
          </el-form-item>
          <el-form-item label="状态">
            <el-radio-group v-model="form.status">
              <el-radio-button :label="1">上架</el-radio-button>
              <el-radio-button :label="0">下架</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </div>

        <el-form-item label="封面 URL">
          <el-input v-model.trim="form.coverUrl" placeholder="https://..." />
        </el-form-item>
        <el-form-item label="分类">
          <el-select
            v-model="categoryNames"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="请选择或输入分类"
            class="full-form-control"
          >
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <div class="tag-editor">
            <el-tag
              v-for="tag in tagNames"
              :key="tag"
              closable
              effect="plain"
              @close="removeTag(tag)"
            >
              {{ tag }}
            </el-tag>
            <el-input
              v-if="tagInputVisible"
              ref="tagInputRef"
              v-model.trim="tagInputValue"
              size="small"
              class="tag-input"
              placeholder="输入标签"
              @keyup.enter="confirmTagInput"
              @blur="confirmTagInput"
            />
            <el-button v-else size="small" :icon="Plus" class="tag-add-button" @click="showTagInput">
              新增标签
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="阅读信息">
          <el-input v-model.trim="form.reading" placeholder="适合人群或阅读建议" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请输入图书描述" />
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
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules, TableInstance } from 'element-plus'
import { Delete, Edit, Plus, Search } from '@element-plus/icons-vue'
import SearchPanel from '@/components/common/SearchPanel.vue'
import {
  addBookApi,
  deleteBookApi,
  getBookDetailApi,
  getBooksApi,
  getCategoryOptionsApi,
  updateBookApi,
  updateBookStatusApi,
} from '@/api/api'
import type { BookFormParams, BookQueryParams } from '@/type/api.request'
import type { BookItem } from '@/type/book'
import type { CategoryOption } from '@/type/category'

type DialogMode = 'create' | 'edit'

interface BookFormState {
  id?: number
  title: string
  author: string
  isbn: string
  coverUrl: string
  price: number
  originalPrice?: number
  description: string
  language: string
  stock: number
  reading: string
  status: number
}

const defaultCover =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="128" viewBox="0 0 96 128"><rect width="96" height="128" fill="%238B9D83"/><rect x="16" y="20" width="64" height="8" rx="1" fill="%23E8DCC7"/><rect x="16" y="36" width="46" height="6" rx="1" fill="%23E8DCC7"/><rect x="16" y="102" width="64" height="4" rx="1" fill="%23E8DCC7"/></svg>'

const loading = ref(false)
const saving = ref(false)
const statusLoadingId = ref<number | null>(null)
const books = ref<BookItem[]>([])
const categories = ref<CategoryOption[]>([])
const total = ref(0)
const dialogVisible = ref(false)
const dialogMode = ref<DialogMode>('create')
const formRef = ref<FormInstance>()
const tableRef = ref<TableInstance>()
const categoryNames = ref<string[]>([])
const tagNames = ref<string[]>([])
const tagInputVisible = ref(false)
const tagInputValue = ref('')
const tagInputRef = ref<{ focus: () => void }>()

const query = reactive<BookQueryParams>({
  page: 1,
  pageSize: 10,
  keyword: '',
  category: '',
  status: undefined,
})

const form = reactive<BookFormState>({
  title: '',
  author: '',
  isbn: '',
  coverUrl: '',
  price: 0,
  originalPrice: undefined,
  description: '',
  language: '中文',
  stock: 0,
  reading: '',
  status: 1,
})

const rules: FormRules = {
  title: [{ required: true, message: '请输入书名', trigger: 'blur' }],
  price: [{ required: true, message: '请输入售价', trigger: 'change' }],
  stock: [{ required: true, message: '请输入库存', trigger: 'change' }],
}

const cleanQuery = computed(() => ({
  page: query.page,
  pageSize: query.pageSize,
  keyword: query.keyword || undefined,
  category: query.category || undefined,
  status: query.status,
}))

onMounted(() => {
  loadBooks()
  loadCategories()
})



async function loadBooks() {
  loading.value = true
  try {
    const res = await getBooksApi(cleanQuery.value)
    books.value = res.data.list
    total.value = res.data.total
    query.page = res.data.page
    query.pageSize = res.data.pageSize
  } finally {
    loading.value = false
  }
}

async function loadCategories() {
  const res = await getCategoryOptionsApi()
  categories.value = res.data
}



function handleSearch() {
  query.page = 1
  loadBooks()
}

function handleReset() {
  query.page = 1
  query.pageSize = 10
  query.keyword = ''
  query.category = ''
  query.status = undefined
  loadBooks()
}

function openCreateDialog() {
  dialogMode.value = 'create'
  resetForm()
  dialogVisible.value = true
}

async function openEditDialog(row: BookItem) {
  dialogMode.value = 'edit'
  resetForm()
  dialogVisible.value = true
  fillForm(row)

  try {
    const res = await getBookDetailApi(row.id)
    fillForm(res.data)
    categoryNames.value = normalizeNameList(res.data.categories ?? [])
    tagNames.value = normalizeNameList(res.data.tags ?? [])
  } catch {
    ElMessage.error('加载图书详情失败')
  }
}

function resetForm() {
  form.id = undefined
  form.title = ''
  form.author = ''
  form.isbn = ''
  form.coverUrl = ''
  form.price = 0
  form.originalPrice = undefined
  form.description = ''
  form.language = '中文'
  form.stock = 0
  form.reading = ''
  form.status = 1
  categoryNames.value = []
  tagNames.value = []
  tagInputVisible.value = false
  tagInputValue.value = ''
  formRef.value?.clearValidate()
}

function fillForm(book: BookItem) {
  form.id = book.id
  form.title = book.title
  form.author = book.author ?? ''
  form.isbn = book.isbn ?? ''
  form.coverUrl = book.coverUrl ?? ''
  form.price = book.price ?? 0
  form.originalPrice = book.originalPrice ?? undefined
  form.description = book.description ?? ''
  form.language = book.language ?? '中文'
  form.stock = book.stock ?? 0
  form.reading = book.reading ?? ''
  form.status = book.status
}

async function handleSave() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    const payload = buildPayload()
    if (dialogMode.value === 'create') {
      await addBookApi(payload as BookFormParams)
      ElMessage.success('新增成功')
    } else if (form.id) {
      await updateBookApi(form.id, payload)
      ElMessage.success('保存成功')
    }
    dialogVisible.value = false
    loadBooks()
    loadCategories()
  } finally {
    saving.value = false
  }
}

async function handleStatusChange(row: BookItem, value: boolean) {
  const nextStatus = value ? 1 : 0
  const actionText = nextStatus === 1 ? '上架' : '下架'

  try {
    await ElMessageBox.confirm(`确定要${actionText}《${row.title}》吗？`, '状态切换', {
      confirmButtonText: actionText,
      cancelButtonText: '取消',
      type: 'warning',
    })
    statusLoadingId.value = row.id
    await updateBookStatusApi(row.id, nextStatus)
    ElMessage.success(`${actionText}成功`)
    row.status = nextStatus
  } catch {
    loadBooks()
  } finally {
    statusLoadingId.value = null
  }
}

async function handleDelete(row: BookItem) {
  try {
    await ElMessageBox.confirm(`确定要删除《${row.title}》吗？`, '删除图书', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'el-button--danger',
    })
    await deleteBookApi(row.id)
    ElMessage.success('删除成功')
    loadBooks()
  } catch {
    // 用户取消删除时保持当前列表不变。
  }
}

function buildPayload() {
  const payload = {
    title: form.title,
    author: form.author || undefined,
    isbn: form.isbn || undefined,
    coverUrl: form.coverUrl || undefined,
    price: Number(form.price),
    originalPrice: form.originalPrice === undefined ? undefined : Number(form.originalPrice),
    description: form.description || undefined,
    language: form.language || undefined,
    stock: Number(form.stock),
    reading: form.reading || undefined,
    status: Number(form.status),
  }

  // 保存时始终提交当前分类和标签数组，后端只替换关系表，不删除标签数据。
  Object.assign(payload, {
    categories: normalizeNameList(categoryNames.value),
    tags: normalizeNameList(tagNames.value),
  })

  return payload
}

function removeTag(tag: string) {
  // 删除标签只影响当前图书的 tag 关系，真实删除由后端关系替换完成。
  tagNames.value = tagNames.value.filter((item) => item !== tag)
}

function showTagInput() {
  tagInputVisible.value = true
  nextTick(() => tagInputRef.value?.focus())
}

function confirmTagInput() {
  const tags = normalizeNameList(tagInputValue.value.split(/[,，]/))
  tagNames.value = normalizeNameList([...tagNames.value, ...tags])
  tagInputVisible.value = false
  tagInputValue.value = ''
}

function normalizeNameList(values: string[]) {
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))]
}

function formatPrice(value: number | null) {
  return Number(value ?? 0).toFixed(2)
}

function formatDate(value: string) {
  if (!value) return '-'
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}
</script>

<style lang="scss" scoped>
.books-page {
  color: #2c2416;
  min-width: 0;
  overflow-x: hidden;
}

.table-card {
  border: 1px solid rgba(96, 108, 56, 0.12);
  border-radius: 8px;
  /* 页面内卡片背景统一使用淡米白，和后台整体视觉保持一致 */
  background: #faf7f1;
}

.books-table {
  --el-table-bg-color: #faf7f1;
  --el-table-tr-bg-color: #faf7f1;
  --el-table-header-bg-color: #faf7f1;
  --el-table-row-hover-bg-color: rgba(139, 157, 131, 0.18);
  --el-table-border-color: rgba(96, 108, 56, 0.14);
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
}

/* 操作列需要同时容纳编辑和删除按钮，禁止按钮被裁剪或换行。 */
.books-table :deep(.el-table__fixed-right),
.books-table :deep(.el-table__fixed-right-patch) {
  overflow: visible;
}

.books-table :deep(.el-table__cell),
.books-table :deep(.cell) {
  min-width: 0;
}

.book-cell {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.book-cover {
  width: 48px;
  height: 64px;
  border-radius: 2px;
  background: #8b9d83;
  box-shadow: 0 8px 20px rgba(96, 108, 56, 0.16);
  flex-shrink: 0;
}

.book-meta {
  min-width: 0;
  max-width: 100%;
}

.book-title {
  font-size: 14px;
  font-weight: 700;
  color: #2c2416;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-sub,
.book-isbn,
.original-price {
  margin-top: 4px;
  font-size: 12px;
  color: #7a6e5e;
}

.price {
  font-weight: 700;
  color: #606c38;
}

.original-price {
  text-decoration: line-through;
}

.table-actions {
  display: inline-flex;
  flex-wrap: nowrap;
  justify-content: center;
  gap: 6px;
  min-width: max-content;
  white-space: nowrap;
}

.table-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.table-actions :deep(.el-button) {
  flex: 0 0 auto;
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

.tag-editor {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 32px;
  padding: 4px 0;
}

.tag-input {
  width: 120px;
}

.tag-add-button {
  border-style: dashed;
}

.book-dialog {
  :deep(.el-dialog) {
    border-radius: 8px;
  }

  :deep(.el-input-number) {
    width: 100%;
  }
}

@media (max-width: 900px) {
  .form-grid {
    display: block;
  }

  .pager-row {
    justify-content: flex-start;
    overflow-x: auto;
  }
}
</style>
