<script setup lang="ts">
import type { JourneyStatus } from '~~/shared/types/journey'
import { JOURNEY_STATUS_COLORS, JOURNEY_STATUS_ICONS } from '~~/shared/types/journey'

const props = defineProps<{
  status: JourneyStatus
}>()

const color = computed(() => (JOURNEY_STATUS_COLORS[props.status] || 'neutral') as 'success' | 'warning' | 'info' | 'neutral' | 'error')
const icon = computed(() => JOURNEY_STATUS_ICONS[props.status] || 'i-lucide-circle')
const label = computed(() => props.status.charAt(0).toUpperCase() + props.status.slice(1))
</script>

<template>
  <UBadge
    :color="color"
    variant="subtle"
    size="sm"
    :icon="icon"
  >
    {{ label }}
  </UBadge>
</template>
