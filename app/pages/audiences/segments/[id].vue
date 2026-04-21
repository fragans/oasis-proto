<script setup lang="ts">
import type { Segment, Contact, SegmentRuleGroup, StandardSegmentCategory } from '~~/shared/types/contact'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()

const segment = ref<Segment | null>(null)
const contacts = ref<Contact[]>([])
const contactsTotal = ref(0)
const loading = ref(true)
const contactsLoading = ref(false)
const editing = ref(false)
const saving = ref(false)
const deleteOpen = ref(false)
const deleting = ref(false)
const contactsPage = ref(1)

const editForm = reactive({
  name: '',
  description: '',
  tags: ''
})
const editRules = ref<SegmentRuleGroup | null>(null)

async function load() {
  loading.value = true
  try {
    segment.value = await $fetch<Segment>(`/api/segments/${route.params.id}`)
    syncEditForm()
    await loadContacts()
  } finally {
    loading.value = false
  }
}

function syncEditForm() {
  if (!segment.value) return
  Object.assign(editForm, {
    name: segment.value.name,
    description: segment.value.description || '',
    tags: (segment.value.tags || []).join(', ')
  })
  editRules.value = segment.value.rules ? structuredClone(toRaw(segment.value.rules)) : null
}

async function loadContacts() {
  contactsLoading.value = true
  try {
    const res = await $fetch<{ contacts: Contact[], total: number }>(`/api/segments/${route.params.id}/contacts`, {
      query: { page: contactsPage.value, limit: 20 }
    })
    contacts.value = res.contacts
    contactsTotal.value = res.total
  } finally {
    contactsLoading.value = false
  }
}

async function onSave() {
  saving.value = true
  try {
    await $fetch(`/api/segments/${route.params.id}`, {
      method: 'PUT',
      body: {
        ...editForm,
        tags: editForm.tags ? editForm.tags.split(',').map(t => t.trim()) : [],
        ...(segment.value?.type === 'dynamic' ? { rules: editRules.value } : {})
      }
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
    await $fetch(`/api/segments/${route.params.id}`, { method: 'DELETE' })
    router.push('/audiences/segments')
  } finally {
    deleting.value = false
  }
}

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

watch(contactsPage, loadContacts)
onMounted(load)
</script>

<template>
  <div
    v-if="loading"
    class="space-y-4"
  >
    <div class="h-8 w-48 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
    <div class="h-64 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
  </div>

  <div
    v-else-if="!segment"
    class="text-center py-16"
  >
    <p class="text-zinc-500">
      Segment not found
    </p>
    <UButton
      to="/audiences/segments"
      label="Back to Segments"
      variant="ghost"
      class="mt-4"
    />
  </div>

  <div
    v-else
    class="space-y-6"
  >
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div
          class="w-12 h-12 rounded-lg flex items-center justify-center"
          :class="segment.type === 'dynamic' ? 'bg-violet-100 dark:bg-violet-900/50' : 'bg-indigo-100 dark:bg-indigo-900/50'"
        >
          <UIcon
            :name="segment.type === 'dynamic' ? 'i-lucide-sparkles' : 'i-lucide-layers'"
            :class="segment.type === 'dynamic' ? 'text-violet-600 dark:text-violet-400' : 'text-indigo-600 dark:text-indigo-400'"
            class="w-6 h-6"
          />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-zinc-900 dark:text-white">
            {{ segment.name }}
          </h1>
          <p class="text-sm text-zinc-500">
            <UBadge
              :color="segment.type === 'dynamic' ? 'warning' : 'info'"
              variant="subtle"
              size="xs"
            >
              {{ segment.type
              }}
            </UBadge>
            <template v-if="segment.category">
              &middot;
              <UBadge
                :label="segment.category"
                color="neutral"
                variant="subtle"
                size="xs"
                class="capitalize"
              />
            </template>
            &middot; {{ segment.contactCount.toLocaleString() }} contacts
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
        <UButton
          icon="i-lucide-trash-2"
          variant="outline"
          color="error"
          @click="deleteOpen = true"
        />
      </div>
    </div>

    <!-- Tags -->
    <div
      v-if="segment.tags.length > 0"
      class="flex gap-1.5 flex-wrap"
    >
      <UBadge
        v-for="tag in segment.tags"
        :key="tag"
        color="neutral"
        variant="subtle"
        size="sm"
      >
        {{ tag }}
      </UBadge>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Segment Info -->
      <div class="space-y-4">
        <div class="border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 bg-white dark:bg-zinc-900">
          <h2 class="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">
            Details
          </h2>

          <div
            v-if="editing"
            class="space-y-3"
          >
            <UFormField
              label="Name"
              size="sm"
            >
              <UInput
                v-model="editForm.name"
                size="sm"
              />
            </UFormField>
            <UFormField
              label="Description"
              size="sm"
            >
              <UInput
                v-model="editForm.description"
                size="sm"
              />
            </UFormField>
            <UFormField
              label="Tags"
              size="sm"
              hint="Comma-separated"
            >
              <UInput
                v-model="editForm.tags"
                size="sm"
              />
            </UFormField>
          </div>

          <dl
            v-else
            class="space-y-3 text-sm"
          >
            <div v-if="segment.description">
              <dt class="text-zinc-500 mb-1">
                Description
              </dt>
              <dd class="text-zinc-900 dark:text-white">
                {{ segment.description }}
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-zinc-500">
                Type
              </dt>
              <dd class="text-zinc-900 dark:text-white capitalize">
                {{ segment.type }}
              </dd>
            </div>
            <div
              v-if="segment.category"
              class="flex justify-between"
            >
              <dt class="text-zinc-500">
                Category
              </dt>
              <dd class="text-zinc-900 dark:text-white capitalize">
                {{ segment.category }}
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-zinc-500">
                Contacts
              </dt>
              <dd class="text-zinc-900 dark:text-white">
                {{ segment.contactCount.toLocaleString() }}
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-zinc-500">
                Created
              </dt>
              <dd class="text-zinc-900 dark:text-white">
                {{ formatDate(segment.createdAt) }}
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-zinc-500">
                Last Refreshed
              </dt>
              <dd class="text-zinc-900 dark:text-white">
                {{ formatDate(segment.lastRefreshedAt) }}
              </dd>
            </div>
          </dl>
        </div>

        <!-- Rules (for dynamic segments) -->
        <div
          v-if="segment.type === 'dynamic'"
          class="border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 bg-white dark:bg-zinc-900"
        >
          <h2 class="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">
            Rules
          </h2>

          <!-- Edit mode: rule builder -->
          <SegmentRuleBuilder
            v-if="editing"
            v-model="editRules"
            :category="(segment.category as StandardSegmentCategory | null) ?? undefined"
          />

          <!-- View mode: readable rules -->
          <SegmentRuleDisplay
            v-else-if="segment.rules"
            :rules="segment.rules"
          />

          <p
            v-else
            class="text-sm text-zinc-400"
          >
            No rules configured
          </p>
        </div>
      </div>

      <!-- Contacts in segment -->
      <div class="lg:col-span-2">
        <div class="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900">
          <div class="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
            <h2 class="text-sm font-semibold text-zinc-900 dark:text-white">
              Contacts in Segment
            </h2>
          </div>

          <table class="w-full text-sm">
            <thead class="bg-zinc-50 dark:bg-zinc-800/50">
              <tr>
                <th class="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">
                  Name
                </th>
                <th class="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">
                  Email
                </th>
                <th class="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">
                  Added
                </th>
              </tr>
            </thead>
            <tbody
              v-if="contactsLoading"
              class="divide-y divide-zinc-100 dark:divide-zinc-800"
            >
              <tr
                v-for="i in 5"
                :key="i"
              >
                <td
                  colspan="3"
                  class="px-4 py-4"
                >
                  <div class="h-4 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                </td>
              </tr>
            </tbody>
            <tbody v-else-if="contacts.length === 0">
              <tr>
                <td
                  colspan="3"
                  class="px-4 py-12 text-center text-zinc-400"
                >
                  No contacts in this segment
                </td>
              </tr>
            </tbody>
            <tbody
              v-else
              class="divide-y divide-zinc-100 dark:divide-zinc-800"
            >
              <tr
                v-for="c in contacts"
                :key="c.id"
                class="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <td class="px-4 py-3">
                  <NuxtLink
                    :to="`/audiences/contacts/${c.id}`"
                    class="font-medium text-zinc-900 dark:text-white hover:text-indigo-600"
                  >
                    {{ [c.firstName, c.lastName].filter(Boolean).join(' ') || 'Unknown' }}
                  </NuxtLink>
                </td>
                <td class="px-4 py-3 text-zinc-500">
                  {{ c.email || '—' }}
                </td>
                <td class="px-4 py-3 text-zinc-500">
                  {{ formatDate(c.updatedAt) }}
                </td>
              </tr>
            </tbody>
          </table>

          <div
            v-if="contactsTotal > 20"
            class="p-4 border-t border-zinc-200 dark:border-zinc-800"
          >
            <UPagination
              v-model="contactsPage"
              :total="contactsTotal"
              :items-per-page="20"
            />
          </div>
        </div>
      </div>
    </div>
    <template v-if="editing">
      <div class="flex gap-2 p-2 sticky bottom-0 bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg justify-end">
        <UButton
          label="Save"
          color="primary"
          size="sm"
          :loading="saving"
          @click="onSave"
        />
        <UButton
          label="Cancel"
          variant="ghost"
          color="neutral"
          size="sm"
          @click="editing = false; syncEditForm()"
        />
      </div>
    </template>
    <!-- Delete dialog -->
    <CampaignConfirmDialog
      :open="deleteOpen"
      title="Delete Segment"
      :description="`Delete '${segment.name}'? All contact memberships will be removed.`"
      confirm-label="Delete"
      confirm-color="error"
      :loading="deleting"
      @update:open="deleteOpen = $event"
      @confirm="onDelete"
    />
  </div>
</template>
