<script setup lang="ts">
const props = defineProps<{
  modelValue: {
    kind: 'gtm-attr'
    key: string
    op: 'equals' | 'contains'
    value: string
  }
}>()

const emit = defineEmits(['update:modelValue'])

const key = computed({
  get: () => props.modelValue.key,
  set: val => emit('update:modelValue', { ...props.modelValue, key: val })
})

const op = computed({
  get: () => props.modelValue.op,
  set: val => emit('update:modelValue', { ...props.modelValue, op: val })
})

const value = computed({
  get: () => props.modelValue.value,
  set: val => emit('update:modelValue', { ...props.modelValue, value: val })
})

const opOptions = [
  { label: 'Equals', value: 'equals' },
  { label: 'Contains', value: 'contains' }
]
</script>

<template>
  <div class="flex gap-4">
    <UInput
      v-model="key"
      placeholder="dataLayer key (e.g. userTier)"
      class="flex-1"
    />
    <USelect
      v-model="op"
      :options="opOptions"
      class="w-40"
    />
    <UInput
      v-model="value"
      placeholder="Expected value"
      class="flex-1"
    />
  </div>
</template>
