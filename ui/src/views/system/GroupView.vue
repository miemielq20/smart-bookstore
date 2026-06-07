<template>
  <div>
    <div class="page-title"><div><h2>权限组管理</h2><div class="sub">管理角色与菜单权限分配</div></div><div><button class="btn btn-primary">+ 新增权限组</button></div></div>
    <div class="table-wrap" style="margin-bottom:24px;">
      <table>
        <thead><tr><th>权限组</th><th>描述</th><th>成员数</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>
          <tr><td><strong>超级管理员</strong></td><td>拥有全部菜单和操作权限</td><td>3</td><td><span class="status-tag status-tag-green">启用</span></td><td class="table-actions"><button class="table-act table-act-edit">权限分配</button><button class="table-act table-act-edit">编辑</button></td></tr>
          <tr><td><strong>客服</strong></td><td>订单管理 + 数据看板（只读）</td><td>5</td><td><span class="status-tag status-tag-green">启用</span></td><td class="table-actions"><button class="table-act table-act-edit">权限分配</button><button class="table-act table-act-edit">编辑</button></td></tr>
          <tr><td><strong>运营</strong></td><td>图书管理 + Banner 管理</td><td>2</td><td><span class="status-tag status-tag-green">启用</span></td><td class="table-actions"><button class="table-act table-act-edit">权限分配</button><button class="table-act table-act-edit">编辑</button></td></tr>
        </tbody>
      </table>
    </div>
    <div class="card-panel">
      <div class="card-header"><h3>权限分配 · 客服</h3><span class="tag">只读 + 订单</span></div>
      <div class="perm-tree">
        <div class="perm-node perm-node-level1"><input type="checkbox" checked /> 数据看板</div>
        <div class="perm-node perm-node-level2"><input type="checkbox" checked /> ▸ 总览</div>
        <div class="perm-node perm-node-level2"><input type="checkbox" checked /> ▸ 访问统计</div>
        <div class="perm-node perm-node-level1"><input type="checkbox" /> 图书管理</div>
        <div class="perm-node perm-node-level2"><input type="checkbox" /> ▸ 图书列表</div>
        <div class="perm-node perm-node-level3"><input type="checkbox" /> ▸ 新增图书</div>
        <div class="perm-node perm-node-level3"><input type="checkbox" /> ▸ 编辑图书</div>
        <div class="perm-node perm-node-level1"><input type="checkbox" checked /> 订单管理</div>
        <div class="perm-node perm-node-level2"><input type="checkbox" checked /> ▸ 订单列表</div>
        <div class="perm-node perm-node-level2"><input type="checkbox" checked /> ▸ 退款管理</div>
        <div class="perm-node perm-node-level3"><input type="checkbox" checked /> ▸ 发货</div>
        <div class="perm-node perm-node-level3"><input type="checkbox" checked /> ▸ 退款审核</div>
        <div class="perm-node perm-node-level1"><input type="checkbox" /> 系统管理</div>
      </div>
      <div style="margin-top:16px;"><button class="btn btn-primary">保存权限</button></div>
    </div>
  </div>
</template>
