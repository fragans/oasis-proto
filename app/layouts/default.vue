<script setup lang="ts">
const route = useRoute()

const isSidebarOpen = ref(true)

const navigation = computed(() => [
  {
    label: 'Campaigns',
    icon: 'i-lucide-megaphone',
    to: '/campaigns',
    active: route.path.startsWith('/campaigns') || route.path.startsWith('/creatives'),
    defaultOpen: true,
    children: [
      { label: 'On Site Message', to: '/campaigns/on-site-messages', icon: 'i-lucide-app-window' },
      { label: 'Creatives', to: '/creatives', icon: 'i-lucide-image' }
    ]
  },
  {
    label: 'Settings',
    icon: 'i-lucide-settings',
    to: '/settings',
    active: route.path.startsWith('/settings'),
    defaultOpen: true,
    children: [
      { label: 'General', to: '/settings', icon: 'i-lucide-layers' }
    ]
  }
])

const breadcrumbs = computed(() => {
  const parts = route.path.split('/').filter(Boolean)
  return parts.map((part, index) => ({
    label: part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' '),
    to: '/' + parts.slice(0, index + 1).join('/')
  }))
})
</script>

<template>
  <div class="flex h-screen overflow-hidden">
    <!-- Sidebar -->
    <aside
      class="flex flex-col border-r border-accented bg-elevated transition-all duration-200 relative z-20"
      :class="isSidebarOpen ? 'w-64' : 'w-16'"
    >
      <!-- Logo -->
      <div class="flex items-center justify-between h-16 px-4 border-b border-muted shrink-0">
        <div class="flex items-center gap-2 overflow-hidden">
          <div
            class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0"
          >
            O
          </div>
          <span
            v-if="isSidebarOpen"
            class="font-semibold text-[--ui-text-highlighted] whitespace-nowrap"
          >OASIS</span>
        </div>
        <UColorModeButton v-if="isSidebarOpen" />
      </div>

      <!-- Navigation -->
      <div class="flex-1 overflow-y-auto p-2">
        <UNavigationMenu
          :items="navigation"
          orientation="vertical"
          :collapsed="!isSidebarOpen"
          variant="pill"
        />
      </div>

      <!-- Sidebar toggle -->
      <div class="p-2 border-t border-muted flex justify-end">
        <UButton
          :icon="isSidebarOpen ? 'i-lucide-panel-left-close' : 'i-lucide-panel-left-open'"
          color="neutral"
          variant="ghost"
          @click="isSidebarOpen = !isSidebarOpen"
        />
      </div>
    </aside>

    <!-- Main content -->
    <div class="flex-1 flex flex-col overflow-hidden relative z-10">
      <!-- Header -->
      <header
        class="flex items-center justify-between h-16 px-6 shrink-0"
      >
        <UBreadcrumb :items="breadcrumbs" />
      </header>

      <!-- Page content -->
      <main class="flex-1 overflow-y-auto p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
