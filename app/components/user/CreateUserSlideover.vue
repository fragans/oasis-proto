<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits(['update:open', 'success'])

const toast = useToast()
interface Organization {
  id: string
  name: string
}

const { data: orgsResponse } = await useAsyncData('organizations-list', () => $fetch<{ organizations: Organization[] }>('/api/organizations'))
const organizations = computed(() => orgsResponse.value?.organizations || [])

const schema = z.object({
  email: z.email('Invalid email'),
  name: z.string().min(2, 'Name is too short'),
  role: z.string().min(1, 'Role is required'),
  organizationId: z.string().optional()
}).refine((data) => {
  if (data.role !== 'super_admin' && !data.organizationId) return false
  return true
}, {
  message: 'Organization is required for this role',
  path: ['organizationId']
})

type Schema = z.output<typeof schema>

const state = reactive({
  email: '',
  name: '',
  role: 'viewer',
  organizationId: undefined
})

const roles = [
  { label: 'Viewer', value: 'viewer' },
  { label: 'Admin', value: 'admin' },
  { label: 'Super Admin', value: 'super_admin' }
]

const loading = ref(false)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    await $fetch('/api/v1/users', {
      method: 'POST',
      body: event.data
    })

    toast.add({
      title: 'User created',
      description: 'Default password: kompas2026',
      color: 'success'
    })

    emit('success')
    emit('update:open', false)

    // Reset state
    state.email = ''
    state.name = ''
    state.role = 'viewer'
    state.organizationId = undefined
  } catch (err: unknown) {
    const error = err as { data?: { statusMessage?: string } }
    toast.add({
      title: 'Error',
      description: error.data?.statusMessage || 'Failed to create user',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})
</script>

<template>
  <USlideover
    v-model:open="isOpen"
    title="Create New User"
    description="Add a new member to the team and assign them to an organization."
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          label="Email"
          name="email"
          required
        >
          <UInput
            v-model="state.email"
            placeholder="email@example.com"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Name"
          name="name"
          required
        >
          <UInput
            v-model="state.name"
            placeholder="Full Name"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Role"
          name="role"
          required
        >
          <USelectMenu
            v-model="state.role"
            :items="roles"
            value-key="value"
            placeholder="Select a role"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Organization"
          name="organizationId"
          :required="state.role !== 'super_admin'"
        >
          <USelectMenu
            v-model="state.organizationId"
            :items="organizations || []"
            value-key="id"
            label-key="name"
            placeholder="Assign to Organization"
            class="w-full"
          />
        </UFormField>

        <div class="flex justify-end gap-3 pt-4">
          <UButton
            variant="ghost"
            label="Cancel"
            @click="isOpen = false"
          />
          <UButton
            type="submit"
            label="Create User"
            :loading="loading"
          />
        </div>
      </UForm>
    </template>
  </USlideover>
</template>
