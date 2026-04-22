<script setup lang="ts">
const props = defineProps<{
  modelValue: {
    kind: 'geo'
    countries?: string[]
    cities?: string[]
    regions?: string[]
  }
}>()

const emit = defineEmits(['update:modelValue'])

const countryString = ref(props.modelValue.countries?.join(', ') || '')
const cityString = ref(props.modelValue.cities?.join(', ') || '')

watch([countryString, cityString], () => {
  emit('update:modelValue', {
    ...props.modelValue,
    countries: countryString.value ? countryString.value.split(',').map(s => s.trim()) : undefined,
    cities: cityString.value ? cityString.value.split(',').map(s => s.trim()) : undefined
  })
})
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <UFormField label="Countries (ISO code, comma separated)">
      <UInput
        v-model="countryString"
        placeholder="ID, SG, US"
      />
    </UFormField>
    <UFormField label="Cities (comma separated)">
      <UInput
        v-model="cityString"
        placeholder="Jakarta, Singapore"
      />
    </UFormField>
  </div>
</template>
