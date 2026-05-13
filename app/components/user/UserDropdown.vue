<script setup lang="ts">
const { user, session, signOut } = useUserSession()
const toast = useToast()

const handleLogout = async () => {
  try {
    await signOut()
    toast.add({
      title: 'Logged out',
      description: 'You have been successfully logged out.',
      color: 'success'
    })
    await navigateTo('/login', { external: true })
  } catch (error) {
    toast.add({
      title: 'Logout failed',
      description: error instanceof Error ? error.message : 'An unknown error occurred',
      color: 'error'
    })
  }
}

const route = useRoute()
const orgSlug = computed(() => (route.params.org as string) || session.value?.activeOrganization?.slug)

const items = computed(() => {
  const prefix = orgSlug.value ? `/${orgSlug.value}` : ''

  return [
    {
      label: 'Team',
      to: `${prefix}/settings/team`,
      icon: 'i-lucide-users'
    },
    {
      label: 'Logout',
      icon: 'i-lucide-log-out',
      color: 'error' as const,
      onSelect: handleLogout
    }
  ]
})
</script>

<template>
  <div class="border border-muted rounded-lg">
    <UDropdownMenu
      :items="items"
      :content="{ align: 'end' }"
    >
      <UButton
        variant="ghost"
        color="neutral"
        class="font-medium"
      >
        <span class="truncate max-w-[150px] hidden sm:inline-block">{{ user?.email }}</span>
        <template #trailing>
          <UIcon
            name="i-lucide-chevron-down"
            class="size-4 text-muted-foreground"
          />
        </template>
      </UButton>
    </UDropdownMenu>
  </div>
</template>
