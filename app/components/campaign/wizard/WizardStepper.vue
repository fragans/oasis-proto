<script setup lang="ts">
import type { StepperItem } from '@nuxt/ui'

const route = useRoute()
const router = useRouter()

const steps: StepperItem[] = [
  { value: 'template', title: 'Template', icon: 'i-lucide-layout-template' },
  { value: 'target', title: 'Target', icon: 'i-lucide-users' },
  { value: 'trigger', title: 'Trigger', icon: 'i-lucide-zap' },
  { value: 'goal', title: 'Goal', icon: 'i-lucide-target' },
  { value: 'launch', title: 'Launch', icon: 'i-lucide-rocket' }
]

const currentStep = computed(() => {
  const parts = route.path.split('/')
  return parts[parts.length - 1]
})

function onStepChange(value: string | number | undefined) {
  if (value) {
    router.push(`/campaigns/on-site-messages/${route.params.id}/wizard/${value}`)
  }
}
</script>

<template>
  <div class="flex items-center justify-center w-full py-4 px-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
    <UStepper
      :items="steps"
      :model-value="currentStep"
      color="primary"
      class="max-w-3xl w-full"
      :linear="false"
      @update:model-value="onStepChange"
    />
  </div>
</template>
