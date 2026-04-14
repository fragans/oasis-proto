<script setup lang="ts">
import { STATUS_COLORS, STATUS_ICONS } from '~~/shared/types/campaign'
import type { CampaignStatus } from '~~/shared/types/campaign'

const props = defineProps<{
  status: CampaignStatus
}>()

const color = computed(() => STATUS_COLORS[props.status] || 'neutral')
const icon = computed(() => STATUS_ICONS[props.status] || 'i-lucide-circle')
const label = computed(() => props.status.charAt(0).toUpperCase() + props.status.slice(1))
</script>

<template>
  <UBadge
    :color="color as any"
    variant="subtle"
    size="sm"
  >
    <UIcon
      :name="icon"
      class="w-3.5 h-3.5 mr-1"
    />
    {{ label }}
  </UBadge>
</template>
