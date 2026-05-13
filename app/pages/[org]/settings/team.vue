<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const { client } = useUserSession()

// Wrap the client call in useAsyncData to get reactive status and refresh
const { data: usersData, refresh, status } = await useAsyncData('team-users', async () => {
  if (!client) return { users: [], total: 0 }
  const res = await client.admin.listUsers({
    query: { limit: 100 }
  })
  return res.data || { users: [], total: 0 }
}, {
  server: false
})

interface UserWithOrg {
  id: string
  name: string
  email: string
  role: string
  organizationId?: string | null
}

const users = computed(() => (usersData.value?.users || []) as UserWithOrg[])

const columns = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'role', header: 'Role' },
  { accessorKey: 'organizationId', header: 'Organization ID' }
]

const isCreateModalOpen = ref(false)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Team Management
        </h1>
        <p class="text-muted">
          Manage your organization members and their roles.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <UButton
          icon="i-lucide-mail-plus"
          label="Invite Member"
          variant="outline"
          color="neutral"
          disabled
          :ui="{
            base: 'opacity-50 cursor-not-allowed'
          }"
        >
          <template #trailing>
            <UBadge
              size="xs"
              variant="subtle"
              color="primary"
            >
              Soon
            </UBadge>
          </template>
        </UButton>
        <UButton
          icon="i-lucide-plus"
          label="Add User"
          @click="isCreateModalOpen = true"
        />
      </div>
    </div>

    <UTable
      :columns="columns"
      :data="users"
      :loading="status === 'pending'"
    >
      <template #role-cell="{ row }">
        <UBadge
          :color="row.original.role === 'super_admin' ? 'primary' : row.original.role === 'admin' ? 'info' : 'neutral'"
          variant="subtle"
          size="sm"
        >
          {{ row.original.role }}
        </UBadge>
      </template>

      <template #organizationId-cell="{ row }">
        <span class="font-mono text-xs">{{ row.original.organizationId }}</span>
      </template>
    </UTable>

    <UserCreateUserSlideover
      v-model:open="isCreateModalOpen"
      @success="refresh"
    />
  </div>
</template>
