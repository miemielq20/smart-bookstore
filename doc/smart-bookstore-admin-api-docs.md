# 智慧书城 — 后台管理系统 API 设计文档 v1.0

> 文档版本：v1.0  
> 最后更新：2026-06-03  
> 基于数据库：`smart-bookstore-schema-v2.sql`（24表）

---

## 1. 通用约定

### 1.1 接口基础路径

```
/api/admin/
```

### 1.2 请求格式

- HTTP 方法：`GET / POST / PUT / DELETE`
- Content-Type: `application/json`
- 分页参数：`?page=1&page_size=20`

### 1.3 通用响应结构

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

分页响应：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [],
    "total": 100,
    "page": 1,
    "page_size": 20
  }
}
```

### 1.4 认证方式

JWT Bearer Token，请求头：`Authorization: Bearer <token>`

---

## 2. 认证模块（Auth）

### POST /api/admin/auth/login

登录，返回 token 和用户信息。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

```json
// Response data
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "admin",
    "nickname": "超级管理员",
    "avatar": null,
    "group_id": 1,
    "group_name": "超级管理员",
    "permissions": ["dashboard:view", "books:view", "books:create", ...]
  }
}
```

关联表：`users`、`permission_groups`、`group_menus`、`menus`

### POST /api/admin/auth/logout

登出，使当前 token 失效。不需要请求体。

### GET /api/admin/auth/userinfo

获取当前登录用户信息。

```json
// Response data
{
  "id": 1,
  "username": "admin",
  "nickname": "超级管理员",
  "avatar": null,
  "phone": null,
  "email": null,
  "group_id": 1,
  "group_name": "超级管理员",
  "last_login_at": "2026-06-03 10:00:00",
  "permissions": ["dashboard:view", ...]
}
```

### PUT /api/admin/auth/password

修改当前用户密码。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| old_password | string | 是 | 旧密码 |
| new_password | string | 是 | 新密码（6-32位） |

---

## 3. 成员管理（Members）

对应菜单："成员管理"，权限前缀 `members:`

### GET /api/admin/members

分页获取成员列表（即后台用户）。

| 查询参数 | 类型 | 必填 | 说明 |
|----------|------|------|------|
| page | int | 否 | 页码，默认1 |
| page_size | int | 否 | 每页条数，默认20 |
| keyword | string | 否 | 搜索关键词（用户名/昵称/手机号） |
| group_id | int | 否 | 按权限组筛选 |
| status | int | 否 | 状态筛选：1=正常 0=禁用 |

```json
// Response data.items[]
{
  "id": 1,
  "username": "admin",
  "nickname": "超级管理员",
  "avatar": null,
  "phone": "13800138000",
  "email": "admin@smartbook.com",
  "group_id": 1,
  "group_name": "超级管理员",
  "status": 1,
  "last_login_at": "2026-06-03 10:00:00",
  "last_login_ip": "192.168.1.1",
  "created_at": "2026-01-01 00:00:00"
}
```

### POST /api/admin/members

新增成员。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名（唯一） |
| password | string | 是 | 密码 |
| nickname | string | 否 | 昵称 |
| phone | string | 否 | 手机号 |
| email | string | 否 | 邮箱 |
| group_id | int | 是 | 权限组ID |
| avatar | string | 否 | 头像URL |

### PUT /api/admin/members/{id}

编辑成员信息。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| nickname | string | 否 | 昵称 |
| phone | string | 否 | 手机号 |
| email | string | 否 | 邮箱 |
| group_id | int | 否 | 权限组ID |
| avatar | string | 否 | 头像URL |

### PUT /api/admin/members/{id}/password

重置成员密码。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| password | string | 是 | 新密码 |

### PUT /api/admin/members/{id}/status

启用/禁用成员。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | int | 是 | 1=启用 0=禁用 |

### DELETE /api/admin/members/{id}

删除成员（软删除，设置 `deleted_at`）。

关联表：`users`

---

## 4. 图书管理（Books）

对应菜单："图书管理"，权限前缀 `books:`

### GET /api/admin/books

分页获取图书列表。

| 查询参数 | 类型 | 必填 | 说明 |
|----------|------|------|------|
| page | int | 否 | 页码 |
| page_size | int | 否 | 每页条数，默认20 |
| keyword | string | 否 | 搜索（书名/作者/ISBN） |
| category_id | int | 否 | 按分类筛选 |
| tag_id | int | 否 | 按标签筛选 |
| status | int | 否 | 状态：1=上架 0=下架 |
| sort_by | string | 否 | 排序字段：sales_count/publish_date/price/created_at |
| sort_order | string | 否 | 排序方向：asc/desc |

```json
// Response data.items[]
{
  "id": 1,
  "title": "深入理解计算机系统",
  "subtitle": "Computer Systems: A Programmer'\''s Perspective",
  "author": "Randal E. Bryant",
  "translator": "龚奕利",
  "publisher": "机械工业出版社",
  "isbn": "9787111544937",
  "cover_url": "https://...",
  "price": 139.00,
  "original_price": 169.00,
  "category_id": 7,
  "category_name": "编程语言",
  "stock": 500,
  "sales_count": 1280,
  "view_count": 5200,
  "rating": 4.8,
  "status": 1,
  "tags": ["计算机", "入门"],
  "created_at": "2026-01-15 10:00:00"
}
```

### GET /api/admin/books/{id}

获取图书详情。

额外返回字段：`description`（描述）、`page_count`（页数）、`language`（语言）、`publish_date`（出版日期）、`binding`（装帧）、`format`（开本）、`weight`（重量）、`tags`（标签列表: `[{id, name, type}]`）、`category_tree`（分类路径: `["计算机", "编程语言"]`）、`created_by`（创建者ID）、`created_by_name`（创建者昵称）

### POST /api/admin/books

新增图书。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 书名 |
| subtitle | string | 否 | 副标题 |
| author | string | 是 | 作者 |
| translator | string | 否 | 译者 |
| publisher | string | 否 | 出版社 |
| isbn | string | 否 | ISBN |
| cover_url | string | 否 | 封面URL |
| price | decimal | 是 | 售价 |
| original_price | decimal | 否 | 原价 |
| category_id | int | 否 | 分类ID |
| description | text | 否 | 图书描述 |
| page_count | int | 否 | 页数 |
| language | string | 否 | 语言，默认"中文" |
| publish_date | date | 否 | 出版日期 |
| binding | string | 否 | 装帧：平装/精装/线装/其他 |
| format | string | 否 | 开本 |
| weight | int | 否 | 重量(g) |
| stock | int | 否 | 库存量 |
| tag_ids | int[] | 否 | 标签ID列表 |

### PUT /api/admin/books/{id}

编辑图书。参数同新增，全部可选。

### DELETE /api/admin/books/{id}

删除图书（软删除）。

### PUT /api/admin/books/{id}/status

上架/下架图书。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | int | 是 | 1=上架 0=下架 |

### GET /api/admin/books/{id}/inventory-logs

查看某本书的库存变动日志。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码 |

```json
// Response data.items[]
{
  "id": 1,
  "change_type": "入库",
  "change_amount": 200,
  "before_stock": 300,
  "after_stock": 500,
  "remark": "新货入库",
  "operator_id": 1,
  "operator_name": "超级管理员",
  "created_at": "2026-03-01 14:30:00"
}
```

关联表：`books`、`book_tag_relations`、`tags`、`categories`、`inventory_logs`

---

## 5. 图书评价管理（Reviews）

### GET /api/admin/reviews

分页获取图书评价列表。

| 查询参数 | 类型 | 必填 | 说明 |
|----------|------|------|------|
| page | int | 否 | 页码 |
| page_size | int | 否 | 每页条数 |
| book_id | int | 否 | 按图书筛选 |
| rating | int | 否 | 按评分筛选（1-5） |
| status | int | 否 | 状态筛选 |
| keyword | string | 否 | 内容关键词 |

```json
// Response data.items[]
{
  "id": 1,
  "book_id": 1,
  "book_title": "深入理解计算机系统",
  "user_id": 10,
  "user_nickname": "读者小明",
  "rating": 5,
  "content": "非常经典的一本书，值得反复阅读。",
  "status": 1,
  "created_at": "2026-04-10 15:00:00"
}
```

### PUT /api/admin/reviews/{id}/status

审核评价（隐藏/显示）。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | int | 是 | 1=显示 0=隐藏 |

关联表：`book_reviews`

---

## 6. 分类管理（Categories）

对应菜单项：可在"图书管理"中内嵌分类 Tab，或独立页面。

### GET /api/admin/categories

获取分类树（带层级结构）。

```json
// Response data
[
  {
    "id": 1,
    "name": "计算机",
    "parent_id": 0,
    "sort": 1,
    "icon": null,
    "status": 1,
    "children": [
      {
        "id": 7,
        "name": "编程语言",
        "parent_id": 1,
        "sort": 1,
        "children": []
      },
      {
        "id": 8,
        "name": "人工智能",
        "parent_id": 1,
        "sort": 2,
        "children": []
      }
    ]
  }
]
```

### POST /api/admin/categories

新增分类。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 分类名称 |
| parent_id | int | 否 | 父分类ID，0=顶级 |
| sort | int | 否 | 排序值 |
| icon | string | 否 | 图标标识 |
| status | int | 否 | 1=启用 0=禁用 |

### PUT /api/admin/categories/{id}

编辑分类（参数同新增，全部可选）。

### DELETE /api/admin/categories/{id}

删除分类。需检查是否包含子分类或关联图书，有则拒绝删除。

关联表：`categories`

---

## 7. 标签管理（Tags）

### GET /api/admin/tags

获取标签列表。支持按类型分组。

| 查询参数 | 类型 | 必填 | 说明 |
|----------|------|------|------|
| type | string | 否 | 按类型筛选：GENRE/THEME/AUDIENCE/FORMAT |

```json
// Response data
[
  {
    "id": 1,
    "name": "Python",
    "type": "GENRE",
    "sort": 1,
    "book_count": 15
  }
]
```

### POST /api/admin/tags

新增标签。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 标签名称（唯一） |
| type | string | 是 | 类型：GENRE/THEME/AUDIENCE/FORMAT |
| sort | int | 否 | 排序值 |

### PUT /api/admin/tags/{id}

编辑标签。

### DELETE /api/admin/tags/{id}

删除标签。需检查是否有关联图书。

关联表：`tags`、`book_tag_relations`

---

## 8. 订单管理（Orders）

对应菜单："订单管理"，权限前缀 `orders:`

### GET /api/admin/orders

分页获取订单列表。

| 查询参数 | 类型 | 必填 | 说明 |
|----------|------|------|------|
| page | int | 否 | 页码 |
| page_size | int | 否 | 每页条数 |
| keyword | string | 否 | 搜索（订单号/收货人/手机号） |
| status | string | 否 | 订单状态：PENDING/PAID/SHIPPED/COMPLETED/CANCELLED/REFUNDING/REFUNDED/REJECTED |
| date_from | string | 否 | 下单起始日期 |
| date_to | string | 否 | 下单结束日期 |
| sort_by | string | 否 | 排序字段：created_at/paid_at/total_amount |
| sort_order | string | 否 | asc/desc |

```json
// Response data.items[]
{
  "id": 1,
  "order_no": "ORD202606030001",
  "user_id": 10,
  "user_nickname": "读者小明",
  "total_amount": 139.00,
  "status": "PAID",
  "tracking_no": null,
  "item_count": 2,
  "remark": null,
  "paid_at": "2026-06-03 10:05:00",
  "shipped_at": null,
  "completed_at": null,
  "cancelled_at": null,
  "created_at": "2026-06-03 10:00:00"
}
```

### GET /api/admin/orders/{id}

获取订单详情。

额外返回：`items`（订单明细 `[{book_id, book_title, book_cover, price, quantity}]`）、`address`（收货地址 `{receiver_name, receiver_phone, province, city, district, detail}`）、`payment`（支付记录 `{payment_no, method, amount, status, paid_at}`）、`refund`（退款记录 `{refund_no, amount, reason, status}`）、`user_nickname`、`user_phone`

### PUT /api/admin/orders/{id}/ship

发货操作。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| tracking_no | string | 是 | 物流单号 |

状态变更：PAID → SHIPPED

### PUT /api/admin/orders/{id}/remark

订单备注。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| remark | string | 是 | 备注内容 |

### PUT /api/admin/orders/{id}/cancel

后台取消订单。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| reason | string | 否 | 取消原因 |

### GET /api/admin/orders/stats

订单统计数据。

```json
// Response data
{
  "total_count": 100,
  "pending_count": 5,
  "paid_count": 20,
  "shipped_count": 15,
  "completed_count": 55,
  "cancelled_count": 3,
  "refunding_count": 2,
  "today_count": 8,
  "today_amount": 1560.00
}
```

关联表：`orders`、`order_items`、`payment_records`、`refund_records`

---

## 9. 退款管理（Refunds）

### GET /api/admin/refunds

分页获取退款申请列表。

| 查询参数 | 类型 | 必填 | 说明 |
|----------|------|------|------|
| page | int | 否 | 页码 |
| page_size | int | 否 | 每页条数 |
| status | string | 否 | PENDING/APPROVED/REJECTED/COMPLETED |

```json
// Response data.items[]
{
  "id": 1,
  "refund_no": "RF202606030001",
  "order_no": "ORD202606030001",
  "amount": 139.00,
  "reason": "商品破损",
  "status": "PENDING",
  "handler_id": null,
  "handler_name": null,
  "handler_note": null,
  "handled_at": null,
  "created_at": "2026-06-03 11:00:00"
}
```

### GET /api/admin/refunds/{id}

退款详情。

### PUT /api/admin/refunds/{id}/approve

审批通过退款（审核退款）。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| handler_note | string | 否 | 处理备注 |

状态变更：PENDING → APPROVED，同时订单状态变为 REFUNDED

### PUT /api/admin/refunds/{id}/reject

拒绝退款。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| handler_note | string | 是 | 拒绝原因 |

关联表：`refund_records`、`orders`

---

## 10. 库存管理（Inventory）

### GET /api/admin/inventory/logs

分页获取库存变动日志。

| 查询参数 | 类型 | 必填 | 说明 |
|----------|------|------|------|
| page | int | 否 | 页码 |
| page_size | int | 否 | 每页条数 |
| book_id | int | 否 | 按图书筛选 |
| change_type | string | 否 | 入库/出库/盘点调整/手动修改 |

### POST /api/admin/inventory/adjust

手动调库。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| book_id | int | 是 | 图书ID |
| change_amount | int | 是 | 变动数量（正数=入库，负数=出库） |
| remark | string | 否 | 变动原因 |

关联表：`inventory_logs`、`books`

---

## 11. 数据看板（Dashboard）

对应菜单："数据看板"，权限前缀 `dashboard:`

### GET /api/admin/dashboard/statistics

获取总览统计数据。

```json
// Response data
{
  "today_orders": 8,
  "today_amount": 1560.00,
  "today_new_users": 12,
  "total_books": 2480,
  "total_orders": 5200,
  "total_users": 8200,
  "pending_orders": 5,
  "low_stock_count": 8
}
```

### GET /api/admin/dashboard/sales-trend

销售趋势（近 N 天）。

| 查询参数 | 类型 | 必填 | 说明 |
|----------|------|------|------|
| days | int | 否 | 天数，默认30 |

```json
// Response data
{
  "dates": ["2026-05-04", "2026-05-05", ...],
  "amounts": [1200.00, 1500.00, ...],
  "counts": [8, 10, ...]
}
```

### GET /api/admin/dashboard/top-books

热销图书排行。

| 查询参数 | 类型 | 必填 | 说明 |
|----------|------|------|------|
| limit | int | 否 | 返回数量，默认10 |

```json
// Response data
[
  {
    "rank": 1,
    "book_id": 1,
    "title": "深入理解计算机系统",
    "author": "Randal E. Bryant",
    "cover_url": "...",
    "sales_count": 1280,
    "amount": 177920.00
  }
]
```

### GET /api/admin/dashboard/order-status

订单状态分布。

```json
// Response data
[
  {"status": "PENDING", "label": "待付款", "count": 5},
  {"status": "PAID", "label": "已付款", "count": 20},
  {"status": "SHIPPED", "label": "已发货", "count": 15},
  {"status": "COMPLETED", "label": "已完成", "count": 55},
  {"status": "CANCELLED", "label": "已取消", "count": 3},
  {"status": "REFUNDING", "label": "退款中", "count": 2}
]
```

### GET /api/admin/dashboard/category-distribution

分类图书分布。

```json
// Response data
[
  {"category": "计算机", "count": 80},
  {"category": "文学小说", "count": 120}
]
```

---

## 12. Banner 管理（Banners）

对应菜单："系统设置 → Banner管理"，权限前缀 `settings:`

### GET /api/admin/banners

获取 Banner 列表（按 sort 排序）。

```json
// Response data
[
  {
    "id": 1,
    "title": "夏季图书大促",
    "image_url": "https://...",
    "link_url": null,
    "link_type": "BOOK",
    "target_id": 1,
    "sort": 1,
    "status": 1,
    "created_at": "2026-05-01 00:00:00"
  }
]
```

### POST /api/admin/banners

新增 Banner。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 标题 |
| image_url | string | 是 | 图片URL |
| link_url | string | 否 | 自定义链接 |
| link_type | string | 是 | 链接类型：BOOK/CATEGORY/URL/NONE |
| target_id | int | 否 | 目标ID（link_type为BOOK/CATEGORY时） |
| sort | int | 否 | 排序值 |
| status | int | 否 | 1=启用 0=禁用 |

### PUT /api/admin/banners/{id}

编辑 Banner。

### DELETE /api/admin/banners/{id}

删除 Banner。

### PUT /api/admin/banners/{id}/sort

更新排序。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| sort | int | 是 | 新排序值 |

关联表：`banners`

---

## 13. 权限组管理（Permission Groups）

对应菜单："系统设置 → 权限组"，权限前缀 `settings:`

### GET /api/admin/groups

获取权限组列表。

```json
// Response data
[
  {
    "id": 1,
    "name": "超级管理员",
    "description": "拥有全部菜单和操作权限",
    "status": 1,
    "member_count": 3,
    "created_at": "2026-01-01 00:00:00"
  },
  {
    "id": 2,
    "name": "客服",
    "description": "订单管理 + 数据看板（只读）",
    "status": 1,
    "member_count": 5,
    "created_at": "2026-01-01 00:00:00"
  }
]
```

### POST /api/admin/groups

新增权限组。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 组名（唯一） |
| description | string | 否 | 描述 |
| status | int | 否 | 1=启用 0=禁用 |

### PUT /api/admin/groups/{id}

编辑权限组。

### DELETE /api/admin/groups/{id}

删除权限组。需检查是否关联用户，有则拒绝删除。

### GET /api/admin/groups/{id}/menus

获取某权限组已分配的菜单/权限树。

```json
// Response data
{
  "group_id": 1,
  "group_name": "超级管理员",
  "menu_ids": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
  "menu_tree": [
    {
      "id": 1,
      "name": "数据看板",
      "checked": true,
      "children": []
    }
  ]
}
```

### PUT /api/admin/groups/{id}/menus

分配菜单权限（全量覆盖）。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| menu_ids | int[] | 是 | 选中的菜单ID列表 |

关联表：`permission_groups`、`group_menus`、`menus`

---

## 14. 菜单管理（Menus）

对应菜单："系统设置 → 菜单管理"，权限前缀 `settings:`

### GET /api/admin/menus

获取完整菜单树（含按钮）。

```json
// Response data
[
  {
    "id": 1,
    "parent_id": 0,
    "name": "数据看板",
    "path": "/dashboard",
    "component": "views/dashboard/index.vue",
    "icon": "DashboardOutlined",
    "type": "MENU",
    "permission_code": "dashboard:view",
    "sort": 1,
    "visible": 1,
    "status": 1,
    "children": []
  },
  {
    "id": 6,
    "parent_id": 0,
    "name": "系统设置",
    "path": null,
    "component": null,
    "icon": "SettingOutlined",
    "type": "MENU",
    "sort": 6,
    "children": [
      {
        "id": 7,
        "name": "权限组",
        "path": "/settings/groups",
        "type": "MENU",
        "permission_code": "settings:groups",
        "children": []
      }
    ]
  }
]
```

### POST /api/admin/menus

新增菜单/按钮。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| parent_id | int | 是 | 父菜单ID，0=顶级 |
| name | string | 是 | 菜单名称 |
| path | string | 否 | 路由路径 |
| component | string | 否 | 组件路径 |
| icon | string | 否 | 图标标识 |
| type | string | 是 | MENU/BUTTON |
| permission_code | string | 否 | 权限标识 |
| sort | int | 否 | 排序值 |
| visible | int | 否 | 1=可见 0=隐藏 |
| status | int | 否 | 1=启用 0=禁用 |

### PUT /api/admin/menus/{id}

编辑菜单。

### DELETE /api/admin/menus/{id}

删除菜单。需检查是否有子菜单或关联了权限组，有则拒绝。

关联表：`menus`

---

## 15. AI 配置（AI Config）

对应菜单："AI 配置"，权限前缀 `ai:`

### GET /api/admin/ai/config

获取 AI 相关配置（不返回 `ai_api_key` 完整值，仅显示掩码）。

```json
// Response data
{
  "ai_model": "deepseek-chat",
  "ai_api_key": "sk-****f3a9",
  "ai_api_base_url": "https://api.deepseek.com/v1",
  "ai_temperature": 0.7,
  "ai_max_tokens": 2048,
  "ai_prompt_template": "你是一个专业的图书推荐助手。"
}
```

### PUT /api/admin/ai/config

更新 AI 配置。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ai_model | string | 否 | 模型名称 |
| ai_api_key | string | 否 | API Key，为空则不更新 |
| ai_api_base_url | string | 否 | API地址 |
| ai_temperature | number | 否 | 生成温度(0-2) |
| ai_max_tokens | number | 否 | 最大输出Token |
| ai_prompt_template | string | 否 | 提示词模板 |

### POST /api/admin/ai/test

测试 AI 连接。用当前配置发送测试消息，返回连接结果。

```json
// Response data
{
  "success": true,
  "response": "连接成功！我是DeepSeek Chat，已准备就绪。",
  "latency_ms": 320
}
```

### GET /api/admin/ai/sessions

获取 AI 对话会话列表（后台审计用）。

| 查询参数 | 类型 | 必填 | 说明 |
|----------|------|------|------|
| page | int | 否 | 页码 |
| page_size | int | 否 | 每页条数 |

### GET /api/admin/ai/sessions/{id}/messages

查看某会话的消息记录。

关联表：`system_configs`（group='ai'）、`ai_sessions`、`ai_messages`

---

## 16. 系统配置（System Configs）

对应菜单："系统设置 → 系统配置"，权限前缀 `settings:`

### GET /api/admin/configs

获取系统配置列表（按分组）。

| 查询参数 | 类型 | 必填 | 说明 |
|----------|------|------|------|
| group | string | 否 | 按分组筛选：site/order/ai |

```json
// Response data
{
  "site": [
    {"key": "site_name", "value": "智慧书城", "type": "STRING", "label": "站点名称"},
    {"key": "site_logo", "value": "", "type": "STRING", "label": "站点 Logo"}
  ],
  "order": [
    {"key": "order_expire_minutes", "value": "15", "type": "NUMBER", "label": "待付款超时时间"},
    {"key": "free_shipping_threshold", "value": "99", "type": "NUMBER", "label": "包邮门槛"},
    {"key": "mock_payment_enabled", "value": "true", "type": "BOOLEAN", "label": "启用模拟支付"}
  ]
}
```

### PUT /api/admin/configs/{key}

更新某项配置。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| value | string | 是 | 配置值 |

关联表：`system_configs`

---

## 17. 审计日志（Audit Logs）

### GET /api/admin/audit-logs

分页获取操作审计日志。

| 查询参数 | 类型 | 必填 | 说明 |
|----------|------|------|------|
| page | int | 否 | 页码 |
| page_size | int | 否 | 每页条数 |
| user_id | int | 否 | 按操作人筛选 |
| action | string | 否 | 按操作类型筛选 |
| target_type | string | 否 | 按目标类型筛选 |
| date_from | string | 否 | 起始日期 |
| date_to | string | 否 | 结束日期 |

```json
// Response data.items[]
{
  "id": 1,
  "user_id": 1,
  "username": "admin",
  "action": "BOOK_CREATE",
  "target_type": "book",
  "target_id": 100,
  "detail": {
    "title": "深入理解计算机系统"
  },
  "ip": "192.168.1.1",
  "created_at": "2026-06-03 10:00:00"
}
```

### GET /api/admin/login-logs

分页获取登录日志。

| 查询参数 | 类型 | 必填 | 说明 |
|----------|------|------|------|
| page | int | 否 | 页码 |
| page_size | int | 否 | 每页条数 |
| username | string | 否 | 按用户名搜索 |
| status | string | 否 | SUCCESS/FAIL |
| date_from | string | 否 | 起始日期 |
| date_to | string | 否 | 结束日期 |

关联表：`audit_logs`、`login_logs`

---

## 18. 通用文件上传（Upload）

### POST /api/admin/upload

上传文件（图片）。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | file | 是 | 文件（Multipart form-data） |

```json
// Response data
{
  "url": "https://oss.smartbook.com/uploads/2026/06/abc123.jpg",
  "size": 204800,
  "mime": "image/jpeg"
}
```

---

## 附录 A：表-接口映射总览

| 表名 | 模块 | 主要接口数 |
|------|------|-----------|
| users | 认证、成员管理 | 8 |
| books | 图书管理 | 6 |
| book_tag_relations | 图书管理（关联） | - |
| categories | 分类管理 | 4 |
| tags | 标签管理 | 4 |
| book_reviews | 评价管理 | 2 |
| orders | 订单管理 | 6 |
| order_items | 订单管理（明细） | - |
| payment_records | 订单管理（支付） | - |
| refund_records | 退款管理 | 4 |
| inventory_logs | 库存管理 | 2 |
| banners | Banner管理 | 5 |
| permission_groups | 权限组管理 | 6 |
| group_menus | 权限组管理（关联） | - |
| menus | 菜单管理 | 4 |
| system_configs | 系统配置、AI配置 | 4 |
| ai_sessions | AI配置（审计） | 1 |
| ai_messages | AI配置（审计） | - |
| audit_logs | 审计日志 | 2 |
| login_logs | 审计日志 | 1 |
| user_addresses | （前台API） | - |
| browse_history | （前台API） | - |
| cart_items | （前台API） | - |
| favorites | （前台API） | - |
| ai_sessions/ai_messages | （前台API） | - |

## 附录 B：数据字典说明

响应字段与数据库字段名称保持一致（驼峰转换），以下为 `snake_case → camelCase` 对照说明：
- `group_id` → `groupId`
- `created_at` → `createdAt`
- `permission_code` → `permissionCode`
- `parent_id` → `parentId`
- `cover_url` → `coverUrl`（或 `cover`）

---

> **设计说明：**
> 1. 本次 API 设计完全围绕后台管理系统场景展开，前台（C端）API（如浏览记录、购物车、收藏、AI对话等）请参考附录中标注"前台API"的表另行设计。
> 2. 每个接口对应模块的权限控制通过 `permission_code` 实现，统一在中间件层做校验。
> 3. 软删除字段（`deleted_at`）在列表查询中默认过滤，仅在后端维护。
