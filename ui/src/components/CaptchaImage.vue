<template>
  <canvas
    ref="canvasRef"
    :width="width"
    :height="height"
    class="captcha-canvas"
    @click="$emit('click')"
  />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = withDefaults(defineProps<{
  text?: string
  width?: number
  height?: number
}>(), {
  text: '点击获取验证码',
  width: 130,
  height: 44,
})

defineEmits<{
  click: []
}>()

const canvasRef = ref<HTMLCanvasElement>()

function draw() {
  const c = canvasRef.value
  if (!c) return
  const ctx = c.getContext('2d')!
  const w = props.width, h = props.height

  /* 底色 */
  ctx.fillStyle = '#f5f0e8'
  ctx.fillRect(0, 0, w, h)
  clipRound(ctx, 0, 0, w, h, 8)

  /* 水墨晕染 */
  for (let i = 0; i < 6; i++) {
    const cx = (Math.random() * 0.6 + 0.2) * w
    const cy = (Math.random() * 0.6 + 0.2) * h
    const r = 20 + Math.random() * 40
    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    grd.addColorStop(0, 'rgba(0,0,0,0.04)')
    grd.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, w, h)
  }

  /* 干扰线 x3 */
  const lineColors = ['rgba(0,0,0,0.08)', 'rgba(44,36,22,0.10)', 'rgba(120,100,80,0.07)']
  for (let i = 0; i < 3; i++) {
    ctx.beginPath()
    ctx.moveTo(Math.random() * w, Math.random() * h)
    ctx.lineTo(Math.random() * w, Math.random() * h)
    
    ctx.strokeStyle = lineColors[i] || 'black';
    ctx.lineWidth = 1
    ctx.stroke()
  }

  /* 噪点 x80 */
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * w, y = Math.random() * h
    const r = Math.random() * 1.2 + 0.3
    ctx.fillStyle = `rgba(${rand(0,100)},${rand(0,80)},${rand(0,60)},${(Math.random() * 0.25 + 0.05).toFixed(2)})`
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
  }

  /* 汉字 */
  const chars = props.text.split('')
  const cx = w / 2, cy = h / 2
  const step = (chars.length > 5) ? 18 : 24
  const sx = cx - ((chars.length - 1) * step) / 2

  /* 重影 */
  ctx.font = '600 16px "PingFang SC","Microsoft YaHei","Noto Serif SC",serif'
  ctx.fillStyle = 'rgba(0,0,0,0.06)'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  chars.forEach((ch, i) => ctx.fillText(ch, sx + i * step + 1, cy + 1))

  /* 主字 */
  chars.forEach((ch, i) => {
    ctx.save()
    const x = sx + i * step + (Math.random() * 4 - 2)
    const y = cy + (Math.random() * 4 - 2)
    ctx.translate(x, y)
    ctx.rotate(((Math.random() * 10 - 5) * Math.PI) / 180)
    ctx.font = '600 16px "PingFang SC","Microsoft YaHei","Noto Serif SC",serif'
    ctx.fillStyle = '#2c2416'
    ctx.globalAlpha = 0.88 + Math.random() * 0.12
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(ch, 0, 0)
    ctx.restore()
  })
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function clipRound(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r)
  ctx.clip()
}

onMounted(() => { draw() })
</script>

<style scoped>
.captcha-canvas {
  display: block;
  border-radius: 10px;
  cursor: pointer;
}
</style>
