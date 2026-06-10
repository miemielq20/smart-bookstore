<template>
  <div>
    <div class="page-title"><div><h2>订单列表</h2><div class="sub">查看和管理所有订单</div></div><div><button class="btn btn-outline">📥 导出</button></div></div>
    <div class="filter-bar">
      <input placeholder="订单号 / 收货人 / 手机号" />
      <select><option>全部状态</option><option>待付款</option><option>已付款</option><option>已发货</option><option>已完成</option><option>退款中</option></select>
      <input type="date" value="2026-06-01" />
      <input type="date" value="2026-06-04" />
      <button class="btn btn-primary">搜索</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>订单号</th><th>用户</th><th>金额</th><th>状态</th><th>下单时间</th><th>操作</th></tr></thead>
        <tbody>
          <tr><td style="font-family:monospace;font-size:12px;">ORD202606040001</td><td>读者小明</td><td>¥139.00</td><td><span class="status-tag status-tag-blue">已付款</span></td><td>06-04 10:23</td><td class="table-actions"><button class="table-act table-act-edit">详情</button><button class="table-act table-act-edit">发货</button></td></tr>
          <tr><td style="font-family:monospace;font-size:12px;">ORD202606030012</td><td>书虫小李</td><td>¥268.00</td><td><span class="status-tag status-tag-green">已完成</span></td><td>06-03 14:15</td><td class="table-actions"><button class="table-act table-act-edit">详情</button></td></tr>
          <tr><td style="font-family:monospace;font-size:12px;">ORD202606030008</td><td>文艺小张</td><td>¥56.00</td><td><span class="status-tag status-tag-yellow">待付款</span></td><td>06-03 09:48</td><td class="table-actions"><button class="table-act table-act-edit">详情</button></td></tr>
          <tr><td style="font-family:monospace;font-size:12px;">ORD202606020045</td><td>求知小王</td><td>¥203.00</td><td><span class="status-tag status-tag-blue">已发货</span></td><td>06-02 16:30</td><td class="table-actions"><button class="table-act table-act-edit">详情</button></td></tr>
          <tr><td style="font-family:monospace;font-size:12px;">ORD202606010033</td><td>读者大明</td><td>¥79.00</td><td><span class="status-tag status-tag-red">退款中</span></td><td>06-01 11:05</td><td class="table-actions"><button class="table-act table-act-edit">详情</button><button class="table-act table-act-danger">退款审核</button></td></tr>
        </tbody>
      </table>
    </div>
    <div class="pagination"><span class="page">‹</span><span class="page page-active">1</span><span class="page">2</span><span class="page">3</span><span class="page">…</span><span class="page">28</span><span class="page">›</span></div>
  </div>
</template>
