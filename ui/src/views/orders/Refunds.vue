<template>
  <div>
    <div class="page-title"><div><h2>退款管理</h2><div class="sub">处理用户退款申请</div></div></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>退款单号</th><th>订单号</th><th>用户</th><th>金额</th><th>原因</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>
          <tr><td style="font-family:monospace;font-size:12px;">RF202606040001</td><td style="font-family:monospace;font-size:12px;">ORD202606010033</td><td>读者大明</td><td>¥79.00</td><td>商品破损</td><td><span class="status-tag status-tag-yellow">待审核</span></td><td class="table-actions"><button class="table-act table-act-edit">通过</button><button class="table-act table-act-danger">拒绝</button></td></tr>
          <tr><td style="font-family:monospace;font-size:12px;">RF202606020002</td><td style="font-family:monospace;font-size:12px;">ORD202605280021</td><td>书迷小赵</td><td>¥56.00</td><td>发错商品</td><td><span class="status-tag status-tag-green">已通过</span></td><td class="table-actions"><button class="table-act table-act-edit">详情</button></td></tr>
          <tr><td style="font-family:monospace;font-size:12px;">RF202605300003</td><td style="font-family:monospace;font-size:12px;">ORD202605250012</td><td>读者小王</td><td>¥135.00</td><td>不想要了</td><td><span class="status-tag status-tag-red">已拒绝</span></td><td class="table-actions"><button class="table-act table-act-edit">详情</button></td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
