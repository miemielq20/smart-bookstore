<template>
  <div>
    <div class="page-title"><div><h2>图书列表</h2><div class="sub">管理图书库存与信息</div></div><div><button class="btn btn-primary">+ 新增图书</button></div></div>
    <div class="filter-bar">
      <input placeholder="搜索书名 / 作者 / ISBN" />
      <select><option>全部分类</option><option>计算机</option><option>文学小说</option><option>人文社科</option></select>
      <select><option>全部状态</option><option>上架</option><option>下架</option></select>
      <button class="btn btn-primary">搜索</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>书名</th><th>作者</th><th>分类</th><th>价格</th><th>库存</th><th>销量</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>
          <tr><td>深入理解计算机系统</td><td>Randal Bryant</td><td>计算机</td><td>¥139.00</td><td>500</td><td>1,280</td><td><span class="status-tag status-tag-green">上架</span></td><td class="table-actions"><button class="table-act table-act-edit">编辑</button><button class="table-act table-act-danger">下架</button></td></tr>
          <tr><td>百年孤独</td><td>加西亚·马尔克斯</td><td>文学小说</td><td>¥56.00</td><td>320</td><td>956</td><td><span class="status-tag status-tag-green">上架</span></td><td class="table-actions"><button class="table-act table-act-edit">编辑</button><button class="table-act table-act-danger">下架</button></td></tr>
          <tr><td>人类简史</td><td>尤瓦尔·赫拉利</td><td>人文社科</td><td>¥68.00</td><td>240</td><td>842</td><td><span class="status-tag status-tag-green">上架</span></td><td class="table-actions"><button class="table-act table-act-edit">编辑</button><button class="table-act table-act-danger">下架</button></td></tr>
          <tr><td>算法导论</td><td>Thomas Cormen</td><td>计算机</td><td>¥135.00</td><td>180</td><td>721</td><td><span class="status-tag status-tag-green">上架</span></td><td class="table-actions"><button class="table-act table-act-edit">编辑</button><button class="table-act table-act-danger">下架</button></td></tr>
          <tr><td>数据结构与算法分析</td><td>Mark Allen Weiss</td><td>计算机</td><td>¥79.00</td><td>0</td><td>534</td><td><span class="status-tag status-tag-red">下架</span></td><td class="table-actions"><button class="table-act table-act-edit">编辑</button><button class="table-act table-act-edit">上架</button></td></tr>
        </tbody>
      </table>
    </div>
    <div class="pagination"><span class="page">‹</span><span class="page page-active">1</span><span class="page">2</span><span class="page">3</span><span class="page">…</span><span class="page">12</span><span class="page">›</span></div>
  </div>
</template>
