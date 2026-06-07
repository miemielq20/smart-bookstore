<template>
  <div>
    <div class="page-title"><div><h2>分类管理</h2><div class="sub">图书分类与层级结构</div></div><div><button class="btn btn-primary">+ 新增分类</button></div></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>分类名称</th><th>父级</th><th>排序</th><th>图书数量</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>
          <tr><td><strong>📂 计算机</strong></td><td>— 顶级 —</td><td>1</td><td>280</td><td><span class="status-tag status-tag-green">启用</span></td><td class="table-actions"><button class="table-act table-act-edit">编辑</button></td></tr>
          <tr><td>&nbsp;&nbsp;&nbsp;├ 编程语言</td><td>计算机</td><td>1</td><td>85</td><td><span class="status-tag status-tag-green">启用</span></td><td class="table-actions"><button class="table-act table-act-edit">编辑</button></td></tr>
          <tr><td>&nbsp;&nbsp;&nbsp;├ 人工智能</td><td>计算机</td><td>2</td><td>62</td><td><span class="status-tag status-tag-green">启用</span></td><td class="table-actions"><button class="table-act table-act-edit">编辑</button></td></tr>
          <tr><td>&nbsp;&nbsp;&nbsp;├ 前端开发</td><td>计算机</td><td>3</td><td>48</td><td><span class="status-tag status-tag-green">启用</span></td><td class="table-actions"><button class="table-act table-act-edit">编辑</button></td></tr>
          <tr><td><strong>📂 文学小说</strong></td><td>— 顶级 —</td><td>2</td><td>420</td><td><span class="status-tag status-tag-green">启用</span></td><td class="table-actions"><button class="table-act table-act-edit">编辑</button></td></tr>
          <tr><td><strong>📂 人文社科</strong></td><td>— 顶级 —</td><td>3</td><td>320</td><td><span class="status-tag status-tag-green">启用</span></td><td class="table-actions"><button class="table-act table-act-edit">编辑</button></td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
