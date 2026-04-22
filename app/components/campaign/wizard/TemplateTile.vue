<script setup lang="ts">
import type { TemplateType } from '~~/shared/types/campaign'

defineProps<{
  tpl: {
    key: TemplateType
    label: string
    description: string
    icon: string
  }
  selected: boolean
}>()

const emit = defineEmits<{
  select: [key: TemplateType]
}>()
</script>

<template>
  <button
    type="button"
    class="relative text-left border rounded-xl p-5 transition-all focus:outline-none h-full group"
    :class="selected
      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 ring-2 ring-indigo-500'
      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900'"
    @click="emit('select', tpl.key)"
  >
    <div class="flex flex-col gap-4">
      <div
        class="w-12 h-12 rounded-xl flex items-center justify-center transition-colors"
        :class="selected ? 'bg-indigo-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'"
      >
        <UIcon
          :name="tpl.icon"
          class="w-6 h-6"
        />
      </div>

      <div>
        <p class="font-bold text-zinc-900 dark:text-white">
          {{ tpl.label }}
        </p>
        <p class="text-sm text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
          {{ tpl.description }}
        </p>
      </div>
    </div>

    <div
      v-if="selected"
      class="absolute top-4 right-4 text-indigo-600 dark:text-indigo-400"
    >
      <UIcon
        name="i-lucide-check-circle-2"
        class="w-6 h-6"
      />
    </div>
  </button>
</template>
