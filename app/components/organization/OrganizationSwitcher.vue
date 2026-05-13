<script setup lang="ts">
const { session, client, user } = useUserSession()
const toast = useToast()

const isSuperAdmin = computed(() => user.value?.role === 'super_admin')

// Fetch organizations the user belongs to
// We use useAsyncData to handle the promise and provide reactivity
const { data: userOrganizations } = await useAsyncData('user-organizations', async () => {
  if (!client) return []

  // If Super Admin, fetch ALL organizations from our custom API
  if (isSuperAdmin.value) {
    const res = await $fetch<{ organizations: Organization[] }>('/api/organizations')
    return res.organizations || []
  }

  // Otherwise, fetch only joined organizations via Better Auth client
  const res = await client.organization.list()
  return (res.data as unknown as Organization[]) || []
})

const organizations = computed(() => userOrganizations.value || [])

const activeOrg = computed(() => {
  const activeId = session.value?.activeOrganizationId
  return organizations.value.find(o => o.id === activeId)
})

interface Organization {
  id: string
  name: string
  slug: string | null
  logo?: string | null
}

async function switchOrganization(org: Organization) {
  const activeId = session.value?.activeOrganizationId
  if (org.id !== activeId) {
    try {
      if (!client) return
      await client.organization.setActive({ organizationId: org.id })

      toast.add({
        title: 'Organization switched',
        description: `Switched to ${org.name}`,
        color: 'success'
      })

      navigateTo(`/${org.slug}/campaigns/on-site-messages`)
    } catch (err) {
      toast.add({
        title: 'Failed to switch organization',
        description: err instanceof Error ? err.message : 'Unknown error',
        color: 'error'
      })
    }
  }
}

const dropdownItems = computed(() => [
  organizations.value.map(org => ({
    label: org.name,
    icon: 'i-lucide-building-2',
    onSelect: () => switchOrganization(org)
  }))
])

const showSwitcher = computed(() => isSuperAdmin.value || organizations.value.length > 1)
</script>

<template>
  <div class="flex items-center gap-3">
    <UDropdownMenu
      v-if="showSwitcher"
      :items="dropdownItems"
      :content="{ align: 'start' }"
    >
      <UButton
        color="neutral"
        variant="subtle"
        icon="i-lucide-building"
        :label="activeOrg?.name || 'Switch Organization'"
        trailing-icon="i-lucide-chevrons-up-down"
        class="w-56 justify-between"
      />
    </UDropdownMenu>

    <div
      v-else-if="activeOrg"
      class="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50 border border-muted text-xs font-medium"
    >
      <UIcon
        name="i-lucide-building"
        class="size-3.5 text-muted-foreground"
      />
      <span>{{ activeOrg.name }}</span>
    </div>
  </div>
</template>
