<template>
  <div class="trend-chart">
    <div class="chart-legend" v-if="secondaryValues">
      <span class="legend-item"><i :style="{ background: primaryColor }"></i>{{ primaryLabel }}</span>
      <span class="legend-item"><i :style="{ background: secondaryColor }"></i>{{ secondaryLabel }}</span>
    </div>
    <svg viewBox="0 0 760 260" role="img" :aria-label="ariaLabel" preserveAspectRatio="none">
      <defs>
        <linearGradient id="trend-fill-primary" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" :stop-color="primaryColor" stop-opacity="0.25" />
          <stop offset="1" :stop-color="primaryColor" stop-opacity="0" />
        </linearGradient>
      </defs>
      <g class="grid-lines">
        <line v-for="line in gridLines" :key="line" x1="44" :y1="line" x2="744" :y2="line" />
      </g>
      <polygon v-if="primaryPoints.length" :points="`${primaryPoints[0]} 744,220 44,220`" fill="url(#trend-fill-primary)" />
      <polyline v-if="primaryPoints.length" class="trend-line" :points="primaryPoints.join(' ')" :stroke="primaryColor" />
      <polyline v-if="secondaryPoints.length" class="trend-line secondary" :points="secondaryPoints.join(' ')" :stroke="secondaryColor" />
      <g v-for="point in pointMeta" :key="point.label">
        <circle :cx="point.x" :cy="point.primaryY" r="4" :fill="primaryColor" class="trend-point">
          <title>{{ point.label }} · {{ formatValue(point.primary) }}</title>
        </circle>
        <circle v-if="point.secondary !== undefined" :cx="point.x" :cy="point.secondaryY" r="3" :fill="secondaryColor" class="trend-point">
          <title>{{ point.label }} · {{ formatValue(point.secondary) }}</title>
        </circle>
        <text v-if="point.showLabel" :x="point.x" y="246" text-anchor="middle">{{ point.label }}</text>
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    labels: string[]
    primaryValues: number[]
    secondaryValues?: number[]
    primaryLabel?: string
    secondaryLabel?: string
    primaryColor?: string
    secondaryColor?: string
    formatter?: (value: number) => string
    ariaLabel?: string
  }>(),
  {
    primaryLabel: '主指标',
    secondaryLabel: '辅助指标',
    primaryColor: '#5c7c61',
    secondaryColor: '#c76d4b',
    ariaLabel: '趋势图',
  },
)

const primaryMax = computed(() => Math.max(...props.primaryValues, 1))
const secondaryMax = computed(() => Math.max(...(props.secondaryValues ?? []), 1))
const gridLines = [40, 100, 160, 220]

function xAt(index: number) {
  return 44 + (index / Math.max(props.labels.length - 1, 1)) * 700
}

function yAt(value: number, max = primaryMax.value) {
  return 220 - (value / max) * 180
}

const primaryPoints = computed(() => props.primaryValues.map((value, index) => `${xAt(index)},${yAt(value)}`))
const secondaryPoints = computed(() => (props.secondaryValues ?? []).map((value, index) => `${xAt(index)},${yAt(value, secondaryMax.value)}`))
const pointMeta = computed(() =>
  props.labels.map((label, index) => ({
    label,
    x: xAt(index),
    showLabel:
      props.labels.length <= 10 ||
      index === 0 ||
      index === props.labels.length - 1 ||
      index % Math.ceil(props.labels.length / 7) === 0,
    primary: props.primaryValues[index] ?? 0,
    primaryY: yAt(props.primaryValues[index] ?? 0),
    secondary: props.secondaryValues?.[index],
    secondaryY: props.secondaryValues ? yAt(props.secondaryValues[index] ?? 0, secondaryMax.value) : 0,
  })),
)

function formatValue(value: number) {
  return props.formatter ? props.formatter(value) : String(value)
}
</script>

<style lang="scss" scoped>
.trend-chart {
  width: 100%;
}

.chart-legend {
  display: flex;
  gap: 18px;
  justify-content: flex-end;
  margin-bottom: 4px;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #7a6e5e;
  font-size: 11px;
}

.legend-item i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

svg {
  display: block;
  width: 100%;
  min-height: 220px;
  overflow: visible;
}

.grid-lines line {
  stroke: #e8dfcf;
  stroke-width: 1;
  stroke-dasharray: 3 5;
}

.trend-line {
  fill: none;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.trend-line.secondary {
  stroke-width: 2;
  stroke-dasharray: 6 5;
}

.trend-point {
  stroke: #faf7f1;
  stroke-width: 2;
}

text {
  fill: #a09282;
  font-size: 11px;
}
</style>
