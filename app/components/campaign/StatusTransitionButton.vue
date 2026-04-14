<script setup lang="ts">
import { STATUS_TRANSITIONS, STATUS_ICONS } from '~~/shared/types/campaign'
import type { CampaignStatus } from '~~/shared/types/campaign'

const props = defineProps<{
  currentStatus: CampaignStatus
}>()

const emit = defineEmits<{
  transition: [status: CampaignStatus]
}>()

const transitions = computed(() => {
  return STATUS_TRANSITIONS[props.currentStatus].map(status => ({
    label: status.charAt(0).toUpperCase() + status.slice(1),
    icon: STATUS_ICONS[status],
    onSelect: () => emit('transition', status)
  }))
})
</script>

<template>
  <UDropdownMenu
    v-if="transitions.length > 0"
    :items="transitions"
  >
    <UButton
      icon="i-lucide-arrow-right-circle"
      label="Change Status"
      color="primary"
      variant="soft"
    />
  </UDropdownMenu>
</template>
