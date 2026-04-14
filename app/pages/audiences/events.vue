<script setup lang="ts">
import type { EventType } from '~~/shared/types/contact'

definePageMeta({ layout: 'default' })

const eventTypes = ref<EventType[]>([])
const loading = ref(true)
const showCreate = ref(false)
const saving = ref(false)
const deleteTarget = ref<EventType | null>(null)
const deleting = ref(false)

const form = reactive({
  key: '',
  label: '',
  category: 'custom',
  description: '',
  parameters: [] as { key: string, type: string, label: string }[]
})

async function load() {
  loading.value = true
  try {
    const res = await $fetch<{ eventTypes: EventType[] }>('/api/event-types')
    eventTypes.value = res.eventTypes
  } finally {
    loading.value = false
  }
}

const groupedEvents = computed(() => {
  const groups: Record<string, EventType[]> = {}
  for (const et of eventTypes.value) {
    const cat = et.category || 'custom'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(et)
  }
  return groups
})

function addParam() {
  form.parameters.push({ key: '', type: 'string', label: '' })
}

function removeParam(idx: number) {
  form.parameters.splice(idx, 1)
}

async function onCreate() {
  saving.value = true
  try {
    await $fetch('/api/event-types', { method: 'POST', body: form })
    Object.assign(form, { key: '', label: '', category: 'custom', description: '', parameters: [] })
    showCreate.value = false
    await load()
  } finally {
    saving.value = false
  }
}

async function onDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await $fetch(`/api/event-types/${deleteTarget.value.id}`, { method: 'DELETE' })
    deleteTarget.value = null
    await load()
  } catch (err) {
    const fetchError = err as any
    if (fetchError?.data?.message) {
      alert(fetchError.data.message)
    }
  } finally {
    deleting.value = false
  }
}

watch(() => form.label, (val) => {
  if (!form.key || form.key === form.label.replace(/\s+/g, '_').toLowerCase().slice(0, -1)) {
    form.key = val.replace(/\s+/g, '_').toLowerCase()
  }
})

onMounted(load)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-zinc-900 dark:text-white">
          Event Types
        </h1>
        <p class="text-sm text-zinc-500 mt-1">
          Define event types to track contact behaviors
        </p>
      </div>
      <UButton
        icon="i-lucide-plus"
        label="Add Event Type"
        color="primary"
        @click="showCreate = true"
      />
    </div>

    <div
      v-if="loading"
      class="space-y-4"
    >
      <div
        v-for="i in 3"
        :key="i"
        class="h-16 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse"
      />
    </div>

    <div
      v-else-if="eventTypes.length === 0"
      class="text-center py-16 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900"
    >
      <UIcon
        name="i-lucide-zap"
        class="w-12 h-12 mx-auto mb-4 text-zinc-300 dark:text-zinc-700"
      />
      <p class="text-zinc-600 dark:text-zinc-400 font-medium">
        No event types defined
      </p>
      <p class="text-sm text-zinc-400 mt-1 mb-4">
        Create event types to start tracking contact behaviors
      </p>
      <UButton
        label="Add Event Type"
        color="primary"
        size="sm"
        @click="showCreate = true"
      />
    </div>

    <div
      v-else
      class="space-y-6"
    >
      <div
        v-for="(events, category) in groupedEvents"
        :key="category"
      >
        <h3 class="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          {{ category }}
        </h3>
        <div class="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800">
          <div
            v-for="et in events"
            :key="et.id"
            class="px-4 py-3"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                  <UIcon
                    name="i-lucide-zap"
                    class="w-4 h-4 text-emerald-500"
                  />
                </div>
                <div>
                  <p class="text-sm font-medium text-zinc-900 dark:text-white">
                    {{ et.label }}
                  </p>
                  <p class="text-xs text-zinc-400">
                    <code class="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">{{ et.key }}</code>
                    <span v-if="et.parameters.length > 0">
                      &middot; {{ et.parameters.length }} param{{ et.parameters.length > 1 ? 's' : '' }}
                    </span>
                    <span v-if="et.isDefault">
                      &middot; <UBadge
                        color="neutral"
                        variant="subtle"
                        size="xs"
                      >Default</UBadge>
                    </span>
                  </p>
                </div>
              </div>
              <UButton
                v-if="!et.isDefault"
                icon="i-lucide-trash-2"
                variant="ghost"
                color="error"
                size="xs"
                @click="deleteTarget = et"
              />
            </div>
            <div
              v-if="et.parameters.length > 0"
              class="ml-11 mt-2 flex gap-1.5 flex-wrap"
            >
              <UBadge
                v-for="p in et.parameters"
                :key="p.key"
                color="neutral"
                variant="subtle"
                size="xs"
              >
                {{ p.label }} ({{ p.type }})
              </UBadge>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <UModal
      :open="showCreate"
      @update:open="showCreate = $event"
    >
      <template #header>
        <h3 class="text-lg font-semibold text-zinc-900 dark:text-white">
          Add Event Type
        </h3>
      </template>
      <template #body>
        <form
          class="space-y-4"
          @submit.prevent="onCreate"
        >
          <UFormField label="Label">
            <UInput
              v-model="form.label"
              placeholder="Page View"
            />
          </UFormField>
          <UFormField
            label="Key"
            hint="Lowercase dot/snake notation"
          >
            <UInput
              v-model="form.key"
              placeholder="page_view"
            />
          </UFormField>
          <UFormField label="Category">
            <UInput
              v-model="form.category"
              placeholder="custom"
            />
          </UFormField>
          <UFormField label="Description">
            <UInput
              v-model="form.description"
              placeholder="Optional description"
            />
          </UFormField>

          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Parameters</label>
              <UButton
                icon="i-lucide-plus"
                variant="ghost"
                size="xs"
                @click="addParam"
              />
            </div>
            <div
              v-for="(param, idx) in form.parameters"
              :key="idx"
              class="flex gap-2 mb-2"
            >
              <UInput
                v-model="param.label"
                placeholder="Label"
                size="sm"
                class="flex-1"
              />
              <UInput
                v-model="param.key"
                placeholder="key"
                size="sm"
                class="flex-1"
              />
              <USelect
                v-model="param.type"
                :items="[{ label: 'String', value: 'string' }, { label: 'Number', value: 'number' }, { label: 'Boolean', value: 'boolean' }, { label: 'Date', value: 'date' }]"
                value-key="value"
                size="sm"
                class="w-28"
              />
              <UButton
                icon="i-lucide-x"
                variant="ghost"
                color="error"
                size="xs"
                @click="removeParam(idx)"
              />
            </div>
          </div>
        </form>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            variant="ghost"
            color="neutral"
            label="Cancel"
            @click="showCreate = false"
          />
          <UButton
            label="Create"
            color="primary"
            :loading="saving"
            @click="onCreate"
          />
        </div>
      </template>
    </UModal>

    <!-- Delete dialog -->
    <CampaignConfirmDialog
      :open="!!deleteTarget"
      title="Delete Event Type"
      :description="`Delete '${deleteTarget?.label}'? This will fail if events of this type exist.`"
      confirm-label="Delete"
      confirm-color="error"
      :loading="deleting"
      @update:open="deleteTarget = null"
      @confirm="onDelete"
    />
  </div>
</template>
