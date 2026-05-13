<script setup lang="ts">
import type { Contact } from '~~/shared/types/contact'

definePageMeta({ layout: 'default' })

const router = useRouter()
const { contacts, total, loading, filters, refresh, updateFilters } = useContacts()
const { deleteContact } = useContact()

const deleteTarget = ref<Contact | null>(null)
const deleting = ref(false)
const showCreateModal = ref(false)

const totalPages = computed(() => Math.ceil(total.value / filters.limit))

async function onDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await deleteContact(deleteTarget.value.id)
    deleteTarget.value = null
    refresh()
  } finally {
    deleting.value = false
  }
}

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function displayName(contact: Contact) {
  if (contact.firstName || contact.lastName) {
    return [contact.firstName, contact.lastName].filter(Boolean).join(' ')
  }
  return contact.email || contact.phone || 'Unknown'
}

function getRowActions(contact: Contact) {
  return [
    { label: 'View', icon: 'i-lucide-eye', onSelect() { router.push(`/audiences/contacts/${contact.id}`) } },
    { type: 'separator' as const },
    { label: 'Delete', icon: 'i-lucide-trash-2', onSelect() { deleteTarget.value = contact } }
  ]
}

async function onExport() {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.tags) params.set('tags', filters.tags)
  window.open(`/api/contacts/export?${params.toString()}`, '_blank')
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm text-zinc-500 mt-1">
          {{ total.toLocaleString() }} contacts in your database
        </p>
      </div>
      <div class="flex gap-2">
        <UButton
          icon="i-lucide-download"
          label="Export"
          variant="outline"
          color="neutral"
          @click="onExport"
        />
        <UButton
          icon="i-lucide-plus"
          label="Add Contact"
          color="primary"
          @click="showCreateModal = true"
        />
      </div>
    </div>

    <!-- Search -->
    <div class="flex gap-3">
      <div class="flex-1 max-w-sm">
        <UInput
          :model-value="filters.search"
          icon="i-lucide-search"
          placeholder="Search by name, email, phone..."
          size="sm"
          @update:model-value="updateFilters({ search: $event as string })"
        />
      </div>
    </div>

    <!-- Table -->
    <div class="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900">
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
              Phone
            </th>
            <th class="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">
              Location
            </th>
            <th class="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">
              Created
            </th>
            <th class="w-10 px-4 py-3" />
          </tr>
        </thead>
        <tbody
          v-if="loading"
          class="divide-y divide-zinc-100 dark:divide-zinc-800"
        >
          <tr
            v-for="i in 5"
            :key="i"
          >
            <td
              colspan="6"
              class="px-4 py-4"
            >
              <div class="h-4 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
            </td>
          </tr>
        </tbody>
        <tbody v-else-if="contacts.length === 0">
          <tr>
            <td
              colspan="6"
              class="px-4 py-16 text-center"
            >
              <UIcon
                name="i-lucide-users"
                class="w-12 h-12 mx-auto mb-4 text-zinc-300 dark:text-zinc-700"
              />
              <p class="text-zinc-600 dark:text-zinc-400 font-medium">
                No contacts yet
              </p>
              <p class="text-sm text-zinc-400 mt-1 mb-4">
                Add your first contact or import from CSV
              </p>
              <UButton
                label="Add Contact"
                color="primary"
                size="sm"
                @click="showCreateModal = true"
              />
            </td>
          </tr>
        </tbody>
        <tbody
          v-else
          class="divide-y divide-zinc-100 dark:divide-zinc-800"
        >
          <tr
            v-for="contact in contacts"
            :key="contact.id"
            class="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
            @click="router.push(`/audiences/contacts/${contact.id}`)"
          >
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <div
                  class="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-medium text-sm shrink-0"
                >
                  {{ displayName(contact).charAt(0).toUpperCase() }}
                </div>
                <span class="font-medium text-zinc-900 dark:text-white">{{ displayName(contact) }}</span>
              </div>
            </td>
            <td class="px-4 py-3 text-zinc-600 dark:text-zinc-400">
              {{ contact.email || '—' }}
            </td>
            <td class="px-4 py-3 text-zinc-600 dark:text-zinc-400">
              {{ contact.phone || '—' }}
            </td>
            <td class="px-4 py-3 text-zinc-500">
              {{ [contact.city, contact.province].filter(Boolean).join(', ') || '—' }}
            </td>
            <td class="px-4 py-3 text-zinc-500">
              {{ formatDate(contact.createdAt) }}
            </td>
            <td
              class="px-4 py-3"
              @click.stop
            >
              <UDropdownMenu :items="getRowActions(contact)">
                <UButton
                  icon="i-lucide-more-horizontal"
                  variant="ghost"
                  color="neutral"
                  size="xs"
                />
              </UDropdownMenu>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div
      v-if="totalPages > 1"
      class="flex items-center justify-between"
    >
      <p class="text-sm text-zinc-500">
        Showing {{ (filters.page - 1) * filters.limit + 1 }}–{{ Math.min(filters.page * filters.limit, total) }} of {{
          total }}
      </p>
      <UPagination
        v-model="filters.page"
        :total="total"
        :items-per-page="filters.limit"
      />
    </div>

    <!-- Create Modal -->
    <ContactCreateModal
      :open="showCreateModal"
      @update:open="showCreateModal = $event"
      @created="showCreateModal = false; refresh()"
    />

    <!-- Delete dialog -->
    <CampaignConfirmDialog
      :open="!!deleteTarget"
      title="Delete Contact"
      :description="`Are you sure you want to delete this contact? This action cannot be undone.`"
      confirm-label="Delete"
      confirm-color="error"
      :loading="deleting"
      @update:open="deleteTarget = null"
      @confirm="onDelete"
    />
  </div>
</template>
