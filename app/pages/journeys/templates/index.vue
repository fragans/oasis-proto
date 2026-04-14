<script setup lang="ts">
import type { EmailTemplate } from '~~/shared/types/journey'

definePageMeta({ layout: 'default' })

const { templates, total, loading, filters, refresh, createTemplate, deleteTemplate } = useEmailTemplates()

const showCreate = ref(false)
const editTarget = ref<EmailTemplate | null>(null)
const deleteTarget = ref<EmailTemplate | null>(null)
const deleting = ref(false)
const saving = ref(false)

const createForm = reactive({
  name: '',
  subject: '',
  bodyHtml: '<h1>Hello {{first_name}}</h1>\n<p>Your message here...</p>',
  bodyText: '',
  category: 'general'
})

const totalPages = computed(() => Math.ceil(total.value / filters.limit))

async function handleCreate() {
  if (!createForm.name.trim() || !createForm.subject.trim()) return
  saving.value = true
  try {
    const variables = extractVariables(createForm.bodyHtml)
    await createTemplate({
      ...createForm,
      variables,
      bodyText: createForm.bodyText || undefined
    })
    showCreate.value = false
    createForm.name = ''
    createForm.subject = ''
    createForm.bodyHtml = '<h1>Hello {{first_name}}</h1>\n<p>Your message here...</p>'
    createForm.bodyText = ''
    createForm.category = 'general'
    refresh()
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await deleteTemplate(deleteTarget.value.id)
    deleteTarget.value = null
    refresh()
  } finally {
    deleting.value = false
  }
}

function extractVariables(html: string): string[] {
  const matches = html.match(/\{\{(\w+)\}\}/g) || []
  return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))]
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-zinc-900 dark:text-white">
          Email Templates
        </h1>
        <p class="text-sm text-zinc-500 mt-1">
          Reusable email templates with dynamic personalization
        </p>
      </div>
      <div class="flex gap-2">
        <UButton
          icon="i-lucide-arrow-left"
          label="Journeys"
          variant="outline"
          color="neutral"
          to="/journeys"
        />
        <UButton
          icon="i-lucide-plus"
          label="New Template"
          color="primary"
          @click="showCreate = true"
        />
      </div>
    </div>

    <!-- Search -->
    <div class="flex items-center">
      <UInput
        :model-value="filters.search"
        placeholder="Search templates..."
        icon="i-lucide-search"
        size="sm"
        class="w-72"
        @update:model-value="filters.search = String($event); filters.page = 1"
      />
    </div>

    <!-- Grid -->
    <div
      v-if="loading"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <div
        v-for="i in 6"
        :key="i"
        class="h-48 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse"
      />
    </div>

    <div
      v-else-if="templates.length === 0"
      class="text-center py-16"
    >
      <UIcon
        name="i-lucide-mail"
        class="w-12 h-12 mx-auto mb-4 text-zinc-300 dark:text-zinc-700"
      />
      <p class="text-zinc-600 dark:text-zinc-400 font-medium">
        No templates yet
      </p>
      <p class="text-sm text-zinc-400 mt-1 mb-4">
        Create your first email template
      </p>
      <UButton
        label="Create Template"
        color="primary"
        size="sm"
        @click="showCreate = true"
      />
    </div>

    <div
      v-else
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <div
        v-for="template in templates"
        :key="template.id"
        class="group border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 overflow-hidden hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
      >
        <!-- Preview area -->
        <div class="h-28 bg-zinc-50 dark:bg-zinc-800/50 px-4 py-3 overflow-hidden">
          <p class="text-xs font-mono text-zinc-400 truncate">
            Subject: {{ template.subject }}
          </p>
          <div
            class="mt-2 text-xs text-zinc-500 line-clamp-3 prose-sm"
            v-html="template.bodyHtml.slice(0, 200)"
          />
        </div>

        <!-- Info -->
        <div class="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-medium text-zinc-900 dark:text-white text-sm">
                {{ template.name }}
              </h3>
              <p class="text-xs text-zinc-500 mt-0.5">
                {{ template.category }} &middot; {{ formatDate(template.updatedAt) }}
              </p>
            </div>
            <UDropdownMenu
              :items="[
                { label: 'Edit', icon: 'i-lucide-pencil', onSelect() { editTarget = template } },
                { type: 'separator' },
                { label: 'Delete', icon: 'i-lucide-trash-2', onSelect() { deleteTarget = template } }
              ]"
            >
              <UButton
                icon="i-lucide-more-horizontal"
                variant="ghost"
                color="neutral"
                size="xs"
              />
            </UDropdownMenu>
          </div>

          <!-- Variables -->
          <div
            v-if="template.variables && template.variables.length > 0"
            class="flex flex-wrap gap-1 mt-2"
          >
            <UBadge
              v-for="v in template.variables"
              :key="v"
              size="xs"
              color="neutral"
              variant="subtle"
            >
              {{ v }}
            </UBadge>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div
      v-if="totalPages > 1"
      class="flex items-center justify-between"
    >
      <p class="text-sm text-zinc-500">
        Showing {{ (filters.page - 1) * filters.limit + 1 }}–{{ Math.min(filters.page * filters.limit, total) }} of {{ total }}
      </p>
      <UPagination
        v-model="filters.page"
        :total="total"
        :items-per-page="filters.limit"
      />
    </div>

    <!-- Create Modal -->
    <UModal v-model:open="showCreate">
      <template #header>
        <h3 class="text-lg font-semibold">
          New Email Template
        </h3>
      </template>

      <template #body>
        <div class="space-y-4">
          <UFormField
            label="Template Name"
            required
          >
            <UInput
              v-model="createForm.name"
              placeholder="e.g. Welcome Email"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Subject Line"
            required
          >
            <UInput
              v-model="createForm.subject"
              placeholder="e.g. Welcome to {{company_name}}"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Category">
            <UInput
              v-model="createForm.category"
              placeholder="general"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="HTML Body"
            required
          >
            <UTextarea
              v-model="createForm.bodyHtml"
              class="w-full font-mono text-xs"
              :rows="10"
              placeholder="<h1>Hello {{first_name}}</h1>"
            />
            <p class="text-xs text-zinc-500 mt-1">
              Use <code class="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">&#123;&#123;variable_name&#125;&#125;</code> for personalization
            </p>
          </UFormField>

          <UFormField label="Plain Text (optional)">
            <UTextarea
              v-model="createForm.bodyText"
              class="w-full text-xs"
              :rows="4"
              placeholder="Hello {{first_name}}..."
            />
          </UFormField>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            variant="ghost"
            color="neutral"
            @click="showCreate = false"
          >
            Cancel
          </UButton>
          <UButton
            :loading="saving"
            :disabled="!createForm.name.trim() || !createForm.subject.trim()"
            @click="handleCreate"
          >
            Create Template
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Delete dialog -->
    <JourneyConfirmDialog
      :open="!!deleteTarget"
      title="Delete Template"
      :description="`Are you sure you want to delete '${deleteTarget?.name}'? This cannot be undone.`"
      confirm-label="Delete"
      :loading="deleting"
      @update:open="deleteTarget = null"
      @confirm="handleDelete"
    />
  </div>
</template>
