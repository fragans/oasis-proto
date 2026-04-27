<script setup lang="ts">
defineProps<{
  saving?: boolean
  canContinue?: boolean
  nextLabel?: string
  nextIcon?: string
}>()

const emit = defineEmits<{
  next: []
  back: []
}>()

const route = useRoute()
const router = useRouter()
const steps = ['template', 'target', 'trigger', 'goal', 'launch']

const currentStepId = computed(() => {
  const parts = route.path.split('/')
  return parts[parts.length - 1]
})

const isFirstStep = computed(() => steps[0] === currentStepId.value)
const isLastStep = computed(() => steps[steps.length - 1] === currentStepId.value)
</script>

<template>
  <div class="fixed bottom-0 inset-x-0 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 z-50">
    <div class="max-w-4xl mx-auto flex items-center justify-between">
      <UButton
        v-if="!isFirstStep"
        variant="ghost"
        color="neutral"
        icon="i-lucide-chevron-left"
        @click="emit('back')"
      >
        Back
      </UButton>
      <div v-else />

      <div class="flex items-center gap-3">
        <UButton
          variant="ghost"
          color="neutral"
          @click="router.push('/campaigns/on-site-messages')"
        >
          Exit Wizard
        </UButton>
        <UButton
          :loading="saving"
          :disabled="!canContinue"
          :trailing-icon="nextIcon || 'i-lucide-chevron-right'"
          @click="emit('next')"
        >
          {{ nextLabel || (isLastStep ? 'Save & Finish' : 'Save & Continue') }}
        </UButton>
      </div>
    </div>
  </div>
</template>
