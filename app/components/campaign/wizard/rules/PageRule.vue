<script setup lang="ts">
const props = defineProps<{
  modelValue: {
    kind: 'page'
    match: 'equals' | 'starts-with' | 'contains' | 'regex'
    value: string
  }
}>()

const emit = defineEmits(['update:modelValue'])

const match = computed({
  get: () => props.modelValue.match,
  set: val => emit('update:modelValue', { ...props.modelValue, match: val })
})

const value = computed({
  get: () => props.modelValue.value,
  set: val => emit('update:modelValue', { ...props.modelValue, value: val })
})

const matchOptions = [
  { label: 'Equals', value: 'equals' },
  { label: 'Starts with', value: 'starts-with' },
  { label: 'Contains', value: 'contains' },
  { label: 'Regex', value: 'regex' }
]
</script>

<template>
  <div class="flex gap-4">
    <USelect
      v-model="match"
      :items="matchOptions"
      class="w-40"
    />
    <UInput
      v-model="value"
      placeholder="/news/sports/*"
      class="flex-1"
    />
  </div>
</template>
