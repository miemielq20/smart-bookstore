<template>
  <div>
    <div class="page-title"><div><h2>AI设置</h2><div class="sub">配置AI对话模型与推荐参数</div></div></div>
    <div class="form-panel">
      <div class="form-group"><label>AI模型</label><input value="deepseek-chat" /><div class="hint">支持的模型：deepseek-chat / gpt-4o / gpt-4o-mini</div></div>
      <div class="form-group"><label>API Key</label><input type="password" value="sk-xxxxxxxxxxxxxxxxxxxx" /><div class="hint">留空则不修改</div></div>
      <div class="form-group"><label>API地址</label><input value="https://api.deepseek.com/v1" /></div>
      <div class="form-group" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div><label>生成温度</label><input value="0.7" /><div class="hint">0 - 2，越高越随机</div></div>
        <div><label>最大Token</label><input value="2048" /></div>
      </div>
      <div class="form-group"><label>AI提示词模板</label><textarea>你是一个专业的图书推荐助手。你了解各类图书的内容特点，能根据用户的阅读偏好提供个性化推荐。</textarea></div>
      <div style="display:flex;gap:10px;"><button class="btn btn-primary">保存配置</button><button class="btn btn-outline">🔗 测试连接</button></div>
    </div>
  </div>
</template>
