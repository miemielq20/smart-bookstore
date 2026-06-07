<template>
  <div class="stat-card">
    <div class="label">{{ label }}</div>
    <div class="value">{{ value }}</div>
    <div v-if="changeText" class="change" :class="changeClass">{{ changeText }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  value: string | number
  changeType?: 'up' | 'down' | 'neutral'
  changeText?: string
}>()

const changeClass = computed(() => {
  if (props.changeType === 'up') return 'up'
  if (props.changeType === 'down') return 'down'
  return ''
})
</script>
