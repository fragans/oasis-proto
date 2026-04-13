<script setup lang="ts">
import type { CampaignStatus } from '~~/shared/types/campaign'

const props = defineProps<{
  currentStatus: CampaignStatus | ''
  search: string
}>()

const emit = defineEmits<{
  'update:status': [status: CampaignStatus | '']
  'update:search': [search: string]
}>()

const statuses: { label: string, value: CampaignStatus | '' }[] = [
  { label: 'All', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Draft', value: 'draft' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Paused', value: 'paused' },
  { label: 'Completed', value: 'completed' }
]

const searchModel = ref(props.search)
let debounceTimer: ReturnType<typeof setTimeout>

watch(searchModel, (val) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => emit('update:search', val), 300)
})
</script>

<template>
  <div class="flex flex-col sm:flex-row gap-3">
    <div class="flex gap-1.5 flex-wrap">
      <UButton
        v-for="s in statuses"
        :key="s.value"
        :label="s.label"
        size="sm"
        :variant="currentStatus === s.value ? 'solid' : 'ghost'"
        :color="currentStatus === s.value ? 'primary' : 'neutral'"
        @click="emit('update:status', s.value)"
      />
    </div>
    <div class="flex-1 sm:max-w-xs ml-auto">
      <UInput
        v-model="searchModel"
        icon="i-lucide-search"
        placeholder="Search campaigns..."
        size="sm"
      />
    </div>
  </div>
</template>
