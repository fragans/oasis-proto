<script setup lang="ts">
import type { DeviceType } from '~~/shared/types/campaign'

const props = defineProps<{
  modelValue: {
    kind: 'device'
    types: DeviceType[]
  }
}>()

const emit = defineEmits(['update:modelValue'])

const options = [
  { label: 'Desktop', value: 'desktop' },
  { label: 'Mobile', value: 'mobile' },
  { label: 'Tablet', value: 'tablet' }
]

function isSelected(value: string) {
  return props.modelValue.types.includes(value as DeviceType)
}

function toggleOption(value: string, checked: boolean) {
  const current = [...props.modelValue.types]
  if (checked) {
    if (!current.includes(value as DeviceType)) {
      current.push(value as DeviceType)
    }
  } else {
    const index = current.indexOf(value as DeviceType)
    if (index > -1) {
      current.splice(index, 1)
    }
  }
  emit('update:modelValue', { ...props.modelValue, types: current })
}
</script>

<template>
  <div class="flex flex-wrap gap-6">
    <UCheckbox
      v-for="opt in options"
      :key="opt.value"
      :model-value="isSelected(opt.value)"
      :label="opt.label"
      @update:model-value="(val: any) => toggleOption(opt.value, !!val)"
    />
  </div>
</template>
