<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
  icon?: string
}>()
</script>

<template>
  <div class="py-12 text-center text-zinc-500">
    <UIcon
      :name="icon || 'i-lucide-image-off'"
      class="w-12 h-12 mx-auto mb-3 opacity-20"
    />
    <p>{{ title || 'No creatives found.' }}</p>
    <p class="text-xs">
      {{ description || '' }}
    </p>
    <div
      v-if="$slots.action"
      class="mt-6"
    >
      <slot name="action" />
    </div>
    <div
      v-else
      class="mt-6"
    >
      <UButton
        label="to Creatives Gallery"
        to="/creatives"
      />
    </div>
  </div>
</template>
