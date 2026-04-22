<script setup lang="ts">
const props = defineProps<{
  modelValue: {
    kind: 'login'
    state: 'logged-in' | 'anonymous'
  }
}>()

const emit = defineEmits(['update:modelValue'])

const state = computed({
  get: () => props.modelValue.state,
  set: val => emit('update:modelValue', { ...props.modelValue, state: val })
})

const items = [
  { label: 'Logged In Only', value: 'logged-in' },
  { label: 'Anonymous Only', value: 'anonymous' }
]
</script>

<template>
  <div class="space-y-2">
    <URadioGroup
      v-model="state"
      :items="items"
      orientation="horizontal"
    />
    <p class="text-xs text-zinc-500 italic">
      remove this rule if you want this campaign seen by all visitor
    </p>
  </div>
</template>
