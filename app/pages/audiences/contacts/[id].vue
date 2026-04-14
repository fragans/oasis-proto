<script setup lang="ts">
import type { ContactWithDetails } from '~~/shared/types/contact'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const { fetchContact, updateContact, deleteContact } = useContact()

const contact = ref<ContactWithDetails | null>(null)
const loading = ref(true)
const editing = ref(false)
const saving = ref(false)
const deleteOpen = ref(false)
const deleting = ref(false)

const editForm = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  city: '',
  province: '',
  birthday: '',
  tags: ''
})

async function load() {
  loading.value = true
  try {
    contact.value = await fetchContact(route.params.id as string)
    syncEditForm()
  } finally {
    loading.value = false
  }
}

function syncEditForm() {
  if (!contact.value) return
  Object.assign(editForm, {
    firstName: contact.value.firstName || '',
    lastName: contact.value.lastName || '',
    email: contact.value.email || '',
    phone: contact.value.phone || '',
    city: contact.value.city || '',
    province: contact.value.province || '',
    birthday: contact.value.birthday || '',
    tags: (contact.value.tags || []).join(', ')
  })
}

async function onSave() {
  saving.value = true
  try {
    await updateContact(route.params.id as string, {
      ...editForm,
      birthday: editForm.birthday || undefined,
      tags: editForm.tags ? editForm.tags.split(',').map(t => t.trim()) : []
    })
    editing.value = false
    await load()
  } finally {
    saving.value = false
  }
}

async function onDelete() {
  deleting.value = true
  try {
    await deleteContact(route.params.id as string)
    router.push('/audiences/contacts')
  } finally {
    deleting.value = false
  }
}

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateTime(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function displayName(c: ContactWithDetails) {
  if (c.firstName || c.lastName) return [c.firstName, c.lastName].filter(Boolean).join(' ')
  return c.email || c.phone || 'Unknown'
}

onMounted(load)
</script>

<template>
  <div v-if="loading" class="space-y-4">
    <div class="h-8 w-48 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
    <div class="h-64 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
  </div>

  <div v-else-if="!contact" class="text-center py-16">
    <p class="text-zinc-500">
      Contact not found
    </p>
    <UButton to="/audiences/contacts" label="Back to Contacts" variant="ghost" class="mt-4" />
  </div>

  <div v-else class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xl">
          {{ (contact.firstName || contact.email || '?')[0].toUpperCase() }}
        </div>
        <div>
          <h1 class="text-2xl font-bold text-zinc-900 dark:text-white">
            {{ displayName(contact) }}
          </h1>
          <p class="text-sm text-zinc-500">
            {{ contact.email || 'No email' }}
          </p>
        </div>
      </div>
      <div class="flex gap-2">
        <UButton
          v-if="!editing"
          icon="i-lucide-pencil"
          label="Edit"
          variant="outline"
          color="neutral"
          @click="editing = true"
        />
        <UButton icon="i-lucide-trash-2" variant="outline" color="error" @click="deleteOpen = true" />
      </div>
    </div>

    <!-- Tags -->
    <div v-if="contact.tags.length > 0" class="flex gap-1.5 flex-wrap">
      <UBadge v-for="tag in contact.tags" :key="tag" color="neutral" variant="subtle" size="sm">
        {{ tag }}
      </UBadge>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Profile Info -->
      <div class="lg:col-span-1 space-y-4">
        <div class="border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 bg-white dark:bg-zinc-900">
          <h2 class="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">
            Profile
          </h2>

          <div v-if="editing" class="space-y-3">
            <div class="grid grid-cols-2 gap-2">
              <UFormField label="First Name" size="sm">
                <UInput v-model="editForm.firstName" size="sm" />
              </UFormField>
              <UFormField label="Last Name" size="sm">
                <UInput v-model="editForm.lastName" size="sm" />
              </UFormField>
            </div>
            <UFormField label="Email" size="sm">
              <UInput v-model="editForm.email" type="email" size="sm" />
            </UFormField>
            <UFormField label="Phone" size="sm">
              <UInput v-model="editForm.phone" size="sm" />
            </UFormField>
            <UFormField label="City" size="sm">
              <UInput v-model="editForm.city" size="sm" />
            </UFormField>
            <UFormField label="Province" size="sm">
              <UInput v-model="editForm.province" size="sm" />
            </UFormField>
            <UFormField label="Birthday" size="sm">
              <UInput v-model="editForm.birthday" type="date" size="sm" />
            </UFormField>
            <UFormField label="Tags" size="sm" hint="Comma-separated">
              <UInput v-model="editForm.tags" size="sm" />
            </UFormField>
            <div class="flex gap-2 pt-2">
              <UButton label="Save" color="primary" size="sm" :loading="saving" @click="onSave" />
              <UButton label="Cancel" variant="ghost" color="neutral" size="sm" @click="editing = false; syncEditForm()" />
            </div>
          </div>

          <dl v-else class="space-y-3 text-sm">
            <div class="flex justify-between">
              <dt class="text-zinc-500">Phone</dt>
              <dd class="text-zinc-900 dark:text-white">{{ contact.phone || '—' }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-zinc-500">Gender</dt>
              <dd class="text-zinc-900 dark:text-white capitalize">{{ contact.gender }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-zinc-500">Birthday</dt>
              <dd class="text-zinc-900 dark:text-white">{{ contact.birthday || '—' }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-zinc-500">Location</dt>
              <dd class="text-zinc-900 dark:text-white">{{ [contact.city, contact.province, contact.country].filter(Boolean).join(', ') || '—' }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-zinc-500">Language</dt>
              <dd class="text-zinc-900 dark:text-white">{{ contact.language }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-zinc-500">Last Seen</dt>
              <dd class="text-zinc-900 dark:text-white">{{ formatDateTime(contact.lastSeenAt) }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-zinc-500">Created</dt>
              <dd class="text-zinc-900 dark:text-white">{{ formatDate(contact.createdAt) }}</dd>
            </div>
          </dl>
        </div>

        <!-- Devices -->
        <div class="border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 bg-white dark:bg-zinc-900">
          <h2 class="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">
            Devices
          </h2>
          <div v-if="contact.devices.length === 0" class="text-sm text-zinc-400">
            No devices registered
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="device in contact.devices"
              :key="device.id"
              class="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg"
            >
              <UIcon
                :name="device.platform === 'ios' ? 'i-lucide-smartphone' : device.platform === 'android' ? 'i-lucide-smartphone' : 'i-lucide-monitor'"
                class="w-5 h-5 text-zinc-400 shrink-0 mt-0.5"
              />
              <div class="text-sm">
                <p class="font-medium text-zinc-900 dark:text-white capitalize">
                  {{ device.platform }} {{ device.deviceModel || '' }}
                </p>
                <p class="text-zinc-500">
                  OS {{ device.osVersion || '—' }} &middot; App {{ device.appVersion || '—' }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Custom Attributes -->
        <div class="border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 bg-white dark:bg-zinc-900">
          <h2 class="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">
            Custom Attributes
          </h2>
          <div v-if="contact.customValues.length === 0" class="text-sm text-zinc-400">
            No custom attributes
          </div>
          <dl v-else class="space-y-2 text-sm">
            <div v-for="cv in contact.customValues" :key="cv.id" class="flex justify-between">
              <dt class="text-zinc-500">{{ cv.attribute?.label || cv.attributeId }}</dt>
              <dd class="text-zinc-900 dark:text-white">{{ cv.value || '—' }}</dd>
            </div>
          </dl>
        </div>

        <!-- Segments -->
        <div class="border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 bg-white dark:bg-zinc-900">
          <h2 class="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">
            Segments
          </h2>
          <div v-if="contact.segments.length === 0" class="text-sm text-zinc-400">
            Not in any segments
          </div>
          <div v-else class="flex gap-1.5 flex-wrap">
            <NuxtLink v-for="seg in contact.segments" :key="seg.id" :to="`/audiences/segments/${seg.id}`">
              <UBadge color="info" variant="subtle" size="sm">
                {{ seg.name }}
              </UBadge>
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Event Timeline -->
      <div class="lg:col-span-2">
        <div class="border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 bg-white dark:bg-zinc-900">
          <h2 class="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">
            Event Timeline
          </h2>
          <div v-if="contact.events.length === 0" class="text-sm text-zinc-400 py-8 text-center">
            No events recorded
          </div>
          <div v-else class="space-y-0">
            <div
              v-for="(ev, idx) in contact.events"
              :key="ev.id"
              class="relative flex gap-4 pb-6"
            >
              <div class="flex flex-col items-center">
                <div class="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                  <UIcon name="i-lucide-zap" class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div v-if="idx < contact.events.length - 1" class="w-px flex-1 bg-zinc-200 dark:bg-zinc-700 mt-2" />
              </div>
              <div class="flex-1 min-w-0 pt-0.5">
                <div class="flex items-baseline justify-between">
                  <p class="font-medium text-zinc-900 dark:text-white text-sm">
                    {{ ev.eventType?.label || ev.eventTypeId }}
                  </p>
                  <time class="text-xs text-zinc-400 shrink-0 ml-2">{{ formatDateTime(ev.occurredAt) }}</time>
                </div>
                <div v-if="ev.properties && Object.keys(ev.properties).length > 0" class="mt-1.5">
                  <div class="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-2.5 text-xs font-mono text-zinc-600 dark:text-zinc-400">
                    <div v-for="(val, key) in ev.properties" :key="String(key)">
                      <span class="text-zinc-400">{{ key }}:</span> {{ val }}
                    </div>
                  </div>
                </div>
                <p class="text-xs text-zinc-400 mt-1">
                  via {{ ev.source }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete dialog -->
    <CampaignConfirmDialog
      :open="deleteOpen"
      title="Delete Contact"
      description="Are you sure you want to delete this contact and all associated data? This action cannot be undone."
      confirm-label="Delete"
      confirm-color="error"
      :loading="deleting"
      @update:open="deleteOpen = $event"
      @confirm="onDelete"
    />
  </div>
</template>
