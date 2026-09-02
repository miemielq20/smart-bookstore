<template>
  <div>
    <div class="page-title">
      <div>
        <h2>菜单管理</h2>
        <div class="sub">配置系统菜单结构与按钮权限</div>
      </div>
      <div><button class="btn btn-primary">+ 新增菜单</button></div>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>菜单名称</th>
            <th>路由路径</th>
            <th>类型</th>
            <th>权限标识</th>
            <th>排序</th>
            <th>可见</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>📊 数据看板</strong></td>
            <td><code style="font-size: 12px; color: #b0a494">/dashboard</code></td>
            <td><span class="status-tag status-tag-blue">菜单</span></td>
            <td><code style="font-size: 11px">dashboard:view</code></td>
            <td>1</td>
            <td>✅</td>
            <td class="table-actions"><button class="table-act table-act-edit">编辑</button></td>
          </tr>
          <tr>
            <td>&nbsp;&nbsp;├ 总览</td>
            <td><code style="font-size: 12px; color: #b0a494">/dashboard/overview</code></td>
            <td><span class="status-tag status-tag-blue">菜单</span></td>
            <td>-</td>
            <td>1</td>
            <td>✅</td>
            <td class="table-actions"><button class="table-act table-act-edit">编辑</button></td>
          </tr>
          <tr>
            <td><strong>📖 图书管理</strong></td>
            <td>-</td>
            <td><span class="status-tag status-tag-blue">菜单</span></td>
            <td><code style="font-size: 11px">books:view</code></td>
            <td>2</td>
            <td>✅</td>
            <td class="table-actions"><button class="table-act table-act-edit">编辑</button></td>
          </tr>
          <tr>
            <td>&nbsp;&nbsp;├ 新增图书(按钮)</td>
            <td>-</td>
            <td><span class="status-tag status-tag-yellow">按钮</span></td>
            <td><code style="font-size: 11px">books:create</code></td>
            <td>0</td>
            <td>-</td>
            <td class="table-actions">
              <button class="table-act table-act-edit">编辑</button
              ><button class="table-act table-act-danger">删除</button>
            </td>
          </tr>
          <tr>
            <td>&nbsp;&nbsp;├ 编辑图书(按钮)</td>
            <td>-</td>
            <td><span class="status-tag status-tag-yellow">按钮</span></td>
            <td><code style="font-size: 11px">books:edit</code></td>
            <td>0</td>
            <td>-</td>
            <td class="table-actions">
              <button class="table-act table-act-edit">编辑</button
              ><button class="table-act table-act-danger">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
