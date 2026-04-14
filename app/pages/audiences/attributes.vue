<script setup lang="ts">
import type { ContactAttribute } from '~~/shared/types/contact'

definePageMeta({ layout: 'default' })

const attributes = ref<ContactAttribute[]>([])
const loading = ref(true)
const showCreate = ref(false)
const saving = ref(false)
const deleteTarget = ref<ContactAttribute | null>(null)
const deleting = ref(false)

const form = reactive({
  key: '',
  label: '',
  type: 'string' as const,
  category: 'custom',
  description: ''
})

const typeOptions = [
  { label: 'Text', value: 'string' },
  { label: 'Number', value: 'number' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'Date', value: 'date' }
]

async function load() {
  loading.value = true
  try {
    const res = await $fetch<{ attributes: ContactAttribute[] }>('/api/attributes')
    attributes.value = res.attributes
  } finally {
    loading.value = false
  }
}

const groupedAttributes = computed(() => {
  const groups: Record<string, ContactAttribute[]> = {}
  for (const attr of attributes.value) {
    const cat = attr.category || 'custom'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(attr)
  }
  return groups
})

async function onCreate() {
  saving.value = true
  try {
    await $fetch('/api/attributes', { method: 'POST', body: form })
    Object.assign(form, { key: '', label: '', type: 'string', category: 'custom', description: '' })
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
    await $fetch(`/api/attributes/${deleteTarget.value.id}`, { method: 'DELETE' })
    deleteTarget.value = null
    await load()
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
        <p class="text-sm text-zinc-500 mt-1">
          Define custom attributes to enrich contact profiles
        </p>
      </div>
      <UButton
        icon="i-lucide-plus"
        label="Add Attribute"
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
      v-else-if="attributes.length === 0"
      class="text-center py-16 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900"
    >
      <UIcon
        name="i-lucide-tag"
        class="w-12 h-12 mx-auto mb-4 text-zinc-300 dark:text-zinc-700"
      />
      <p class="text-zinc-600 dark:text-zinc-400 font-medium">
        No custom attributes defined
      </p>
      <p class="text-sm text-zinc-400 mt-1 mb-4">
        Create attributes to store additional data on contacts
      </p>
      <UButton
        label="Add Attribute"
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
        v-for="(attrs, category) in groupedAttributes"
        :key="category"
      >
        <h3 class="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          {{ category }}
        </h3>
        <div class="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800">
          <div
            v-for="attr in attrs"
            :key="attr.id"
            class="flex items-center justify-between px-4 py-3"
          >
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                <UIcon
                  name="i-lucide-tag"
                  class="w-4 h-4 text-amber-500"
                />
              </div>
              <div>
                <p class="text-sm font-medium text-zinc-900 dark:text-white">
                  {{ attr.label }}
                </p>
                <p class="text-xs text-zinc-400">
                  <code class="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">{{ attr.key }}</code>
                  &middot; {{ attr.type }}
                  <span v-if="attr.isDefault">
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
              v-if="!attr.isDefault"
              icon="i-lucide-trash-2"
              variant="ghost"
              color="error"
              size="xs"
              @click="deleteTarget = attr"
            />
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
          Add Custom Attribute
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
              placeholder="Subscription Plan"
            />
          </UFormField>
          <UFormField
            label="Key"
            hint="Lowercase snake_case"
          >
            <UInput
              v-model="form.key"
              placeholder="subscription_plan"
            />
          </UFormField>
          <UFormField label="Type">
            <USelect
              v-model="form.type as any"
              :items="typeOptions"
              value-key="value"
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
      title="Delete Attribute"
      :description="`Delete '${deleteTarget?.label}'? Any contact data stored for this attribute will also be removed.`"
      confirm-label="Delete"
      confirm-color="error"
      :loading="deleting"
      @update:open="deleteTarget = null"
      @confirm="onDelete"
    />
  </div>
</template>
