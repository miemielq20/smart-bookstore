<template>
  <div>
    <!-- 页面标题 -->
    <div class="page-title">
      <div>
        <h2>权限组管理</h2>
        <div class="sub">管理角色与菜单权限分配</div>
      </div>
      <div>
        <el-button type="primary" @click="openCreateDialog">+ 新增权限组</el-button>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="card-panel" style="padding:0;">
    <el-table :data="groups" class="groups-table" header-row-class-name="table-header">
      <el-table-column prop="name" label="权限组" min-width="140">
        <template #default="{ row }">
          <strong>{{ row.name }}</strong>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" min-width="150" />
      <el-table-column prop="memberCount" label="成员数" width="120" align="center" />
      <el-table-column prop="status" label="状态" width="120" align="center">
        <template #default="{ row }">
          <span class="status-tag" :class="row.status === 1 ? 'status-on' : 'status-off'">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" align="center">
        <template #default="{ row }">
          <el-button size="small" type="warning" plain @click="openAssignDialog(row)">权限分配</el-button>
          <el-button size="small" @click="openEditDialog(row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>
    </div>

    <!-- ====== 新增权限组对话框 ====== -->
    <el-dialog v-model="createVisible" title="新增权限组" width="560px" destroy-on-close>
      <el-form :model="createForm" label-width="80px">
        <el-form-item label="名称" required>
          <el-input v-model="createForm.name" placeholder="请输入权限组名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="createForm.description" type="textarea" :rows="2" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="菜单权限">
          <el-tree ref="createTreeRef" :default-expanded-keys="allParentIds"
            :data="menuTree"
            show-checkbox
            node-key="id"
            :default-checked-keys="createForm.menuIds"
            :props="{ label: 'name', children: 'children' }"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreate" :loading="creating">确定</el-button>
      </template>
    </el-dialog>

    <!-- ====== 权限分配对话框 ====== -->
    <el-dialog v-model="assignVisible" :title="`权限分配 · ${assignRow?.name || ''}`" width="560px" destroy-on-close>
      <el-tree ref="assignTreeRef" :default-expanded-keys="allParentIds"
        :data="menuTree"
        show-checkbox
        node-key="id"
        :default-checked-keys="assignMenuIds"
        :props="{ label: 'name', children: 'children' }"
      />
      <template #footer>
        <el-button @click="assignVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAssign" :loading="assigning">保存权限</el-button>
      </template>
    </el-dialog>

    <!-- ====== 编辑权限组对话框 ====== -->
    <el-dialog v-model="editVisible" :title="`编辑 · ${editRow?.name || ''}`" width="460px" destroy-on-close>
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="名称" required>
          <el-input v-model="editForm.name" placeholder="请输入权限组名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editForm.description" type="textarea" :rows="2" placeholder="请输入描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="handleEdit" :loading="editing">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick,computed } from "vue"
import { ElMessage } from "element-plus"
import type { ElTree } from "element-plus"
import request from "@/api/request"

/* ====== 类型 ====== */
interface GroupRow {
  id: number
  name: string
  description: string | null
  status: number
  memberCount: number
}

interface MenuNode {
  id: number
  name: string
  children: MenuNode[]
}

/* ====== 数据 ====== */
const groups = ref<GroupRow[]>([])
const menuTree = ref<MenuNode[]>([])

/* ====== 加载数据 ====== */
async function loadGroups() {
  try {
    const res = await request.get("/permission-groups")
    groups.value = (res as any).data ?? res
  } catch { groups.value = [] }
}

async function loadMenuTree() {
  try {
    const res = await request.get("/permission-groups/menu-tree")
    menuTree.value = (res as any).data ?? res
  } catch { menuTree.value = [] }
}

/* 默认展开所有一级父节点 */
const allParentIds = computed(() => menuTree.value.filter((m: any) => m.children.length > 0).map((m: any) => m.id))

onMounted(() => {
  loadGroups()
  loadMenuTree()
})

/* ====== 新增 ====== */
const createVisible = ref(false)
const creating = ref(false)
const createForm = reactive({ name: "", description: "", menuIds: [] as number[] })
const createTreeRef = ref<InstanceType<typeof ElTree>>()

function openCreateDialog() {
  createForm.name = ""
  createForm.description = ""
  createForm.menuIds = []
  createVisible.value = true
  nextTick(() => createTreeRef.value?.setCheckedKeys([]))
}

async function handleCreate() {
  if (!createForm.name) {
    ElMessage.warning("请输入权限组名称")
    return
  }
  creating.value = true
  try {
    const checked = createTreeRef.value?.getCheckedKeys() as number[]
    const halfChecked = createTreeRef.value?.getHalfCheckedKeys() as number[]
    const menuIds = [...checked, ...halfChecked]
    await request.post("/permission-groups", {
      name: createForm.name,
      description: createForm.description || undefined,
      menuIds,
    })
    ElMessage.success("新增成功")
    createVisible.value = false
    loadGroups()
  } finally {
    creating.value = false
  }
}

/* ====== 权限分配 ====== */
const assignVisible = ref(false)
const assigning = ref(false)
const assignRow = ref<GroupRow | null>(null)
const assignMenuIds = ref<number[]>([])
const assignTreeRef = ref<InstanceType<typeof ElTree>>()

async function openAssignDialog(row: GroupRow) {
  assignRow.value = row
  assignMenuIds.value = []
  try {
    const res = await request.get(`/permission-groups/${row.id}/menus`)
    assignMenuIds.value = (res as any).data ?? res
  } catch { assignMenuIds.value = [] }
  assignVisible.value = true
}

async function handleAssign() {
  assigning.value = true
  try {
    const checked = assignTreeRef.value?.getCheckedKeys() as number[]
    const halfChecked = assignTreeRef.value?.getHalfCheckedKeys() as number[]
    const menuIds = [...checked, ...halfChecked]
    await request.put(`/permission-groups/${assignRow.value!.id}`, { menuIds })
    ElMessage.success("权限已更新")
    assignVisible.value = false
    loadGroups()
  } finally {
    assigning.value = false
  }
}

/* ====== 编辑 ====== */
const editVisible = ref(false)
const editing = ref(false)
const editRow = ref<GroupRow | null>(null)
const editForm = reactive({ name: "", description: "" })

function openEditDialog(row: GroupRow) {
  editRow.value = row
  editForm.name = row.name
  editForm.description = row.description ?? ""
  editVisible.value = true
}

async function handleEdit() {
  if (!editForm.name) {
    ElMessage.warning("请输入权限组名称")
    return
  }
  editing.value = true
  try {
    await request.put(`/permission-groups/${editRow.value!.id}`, {
      name: editForm.name,
      description: editForm.description || undefined,
    })
    ElMessage.success("保存成功")
    editVisible.value = false
    loadGroups()
  } finally {
    editing.value = false
  }
}
</script>

<style lang="scss" scoped>
.groups-table {
  --el-table-bg-color: #faf7f1;
  --el-table-tr-bg-color: #faf7f1;
  --el-table-header-bg-color: #efe9dc;
  --el-table-row-hover-bg-color: rgba(45, 90, 61, 0.04);
  --el-table-border-color: #efe9dc;
  border-radius: 14px;
  overflow: hidden;

  :deep(.table-header) th {
    background: #efe9dc;
    color: #7a6e5e;
    font-size: 12px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid #e5dcc8;
  }

  :deep(td) {
    color: #2c2416;
    font-size: 13px;
    border-bottom: 1px solid #efe9dc;
    background: #faf7f1;
  }

  :deep(.el-table__inner-wrapper::before) {
    display: none;
  }
}

.status-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;

  &.status-on {
    background: #ecfdf5;
    color: #059669;
  }

  &.status-off {
    background: #f1f5f9;
    color: #64748b;
  }
}
</style>