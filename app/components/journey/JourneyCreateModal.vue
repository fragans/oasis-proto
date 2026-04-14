<script setup lang="ts">
const emit = defineEmits<{
  created: [journey: { id: string }]
}>()

const open = defineModel<boolean>('open', { default: false })

const { createJourney } = useJourney()

const form = reactive({
  name: '',
  description: '',
  triggerType: 'event' as 'event' | 'segment' | 'schedule' | 'manual'
})

const triggerOptions = [
  { label: 'Event Trigger', value: 'event', description: 'Start when a contact performs an event', icon: 'i-lucide-zap' },
  { label: 'Segment Entry', value: 'segment', description: 'Start when a contact enters a segment', icon: 'i-lucide-users' },
  { label: 'Scheduled', value: 'schedule', description: 'Run on a time-based schedule', icon: 'i-lucide-clock' },
  { label: 'Manual', value: 'manual', description: 'Enroll contacts manually', icon: 'i-lucide-hand' }
]

const saving = ref(false)

async function handleCreate() {
  if (!form.name.trim()) return

  saving.value = true
  try {
    const journey = await createJourney({
      name: form.name,
      description: form.description || undefined,
      triggerType: form.triggerType
    })
    open.value = false
    form.name = ''
    form.description = ''
    form.triggerType = 'event'
    emit('created', journey as { id: string })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UModal v-model:open="open">
    <template #header>
      <h3 class="text-lg font-semibold">
        Create Journey
      </h3>
    </template>

    <template #body>
      <div class="space-y-4">
        <UFormField
          label="Journey Name"
          required
        >
          <UInput
            v-model="form.name"
            placeholder="e.g. Welcome Series"
            autofocus
            class="w-full"
          />
        </UFormField>

        <UFormField label="Description">
          <UTextarea
            v-model="form.description"
            placeholder="What does this journey do?"
            class="w-full"
            :rows="2"
          />
        </UFormField>

        <UFormField label="Trigger Type">
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="trigger in triggerOptions"
              :key="trigger.value"
              type="button"
              class="flex items-start gap-3 p-3 rounded-lg border text-left text-sm transition-all"
              :class="form.triggerType === trigger.value
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 ring-1 ring-indigo-500'
                : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'"
              @click="form.triggerType = trigger.value as typeof form.triggerType"
            >
              <UIcon
                :name="trigger.icon"
                class="w-5 h-5 mt-0.5 text-indigo-500 shrink-0"
              />
              <div>
                <div class="font-medium text-zinc-900 dark:text-white">
                  {{ trigger.label }}
                </div>
                <div class="text-xs text-zinc-500 mt-0.5">
                  {{ trigger.description }}
                </div>
              </div>
            </button>
          </div>
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          variant="ghost"
          color="neutral"
          @click="open = false"
        >
          Cancel
        </UButton>
        <UButton
          :loading="saving"
          :disabled="!form.name.trim()"
          @click="handleCreate"
        >
          Create Journey
        </UButton>
      </div>
    </template>
  </UModal>
</template>
