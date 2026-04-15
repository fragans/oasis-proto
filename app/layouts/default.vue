<script setup lang="ts">
const route = useRoute()

const navigation = [
  {
    label: 'Campaigns',
    icon: 'i-lucide-megaphone',
    to: '/campaigns'
  },
  {
    label: 'Audiences',
    icon: 'i-lucide-users',
    to: '/audiences',
    children: [
      { label: 'Overview', to: '/audiences', icon: 'i-lucide-layout-dashboard' },
      { label: 'Contacts', to: '/audiences/contacts', icon: 'i-lucide-contact' },
      { label: 'Segments', to: '/audiences/segments', icon: 'i-lucide-layers' },
      { label: 'Attributes', to: '/audiences/attributes', icon: 'i-lucide-tag' },
      { label: 'Event Types', to: '/audiences/events', icon: 'i-lucide-zap' }
    ]
  },
  {
    label: 'Journeys',
    icon: 'i-lucide-route',
    to: '/journeys',
    children: [
      { label: 'All Journeys', to: '/journeys', icon: 'i-lucide-route' },
      { label: 'Email Templates', to: '/journeys/templates', icon: 'i-lucide-mail' }
    ]
  },
  {
    label: 'Reports',
    icon: 'i-lucide-bar-chart-3',
    to: '/reports',
    disabled: true
  },
  {
    label: 'Settings',
    icon: 'i-lucide-settings',
    to: '/settings/api'
  }
]

const expandedSections = ref<string[]>(['Audiences', 'Journeys'])

const isSidebarOpen = ref(true)

const breadcrumbs = computed(() => {
  const parts = route.path.split('/').filter(Boolean)
  return parts.map((part, index) => ({
    label: part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' '),
    to: '/' + parts.slice(0, index + 1).join('/')
  }))
})
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
    <!-- Sidebar -->
    <aside
      class="flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-all duration-200"
      :class="isSidebarOpen ? 'w-64' : 'w-16'"
    >
      <!-- Logo -->
      <div class="flex items-center justify-between h-16 px-4 border-b border-zinc-200 dark:border-zinc-800">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            O
          </div>
          <span
            v-if="isSidebarOpen"
            class="font-semibold text-zinc-900 dark:text-white"
          >OASIS</span>
        </div>
        <template v-if="isSidebarOpen">
          <UColorModeButton />
        </template>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 p-3 space-y-1 overflow-y-auto">
        <template
          v-for="item in navigation"
          :key="item.label"
        >
          <!-- Item with children -->
          <div v-if="item.children && isSidebarOpen">
            <button
              class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full"
              :class="route.path.startsWith(item.to) ? 'text-indigo-700 dark:text-indigo-300' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'"
              @click="expandedSections.includes(item.label) ? expandedSections = expandedSections.filter(s => s !== item.label) : expandedSections.push(item.label)"
            >
              <UIcon
                :name="item.icon"
                class="w-5 h-5 shrink-0"
              />
              <span class="flex-1 text-left">{{ item.label }}</span>
              <UIcon
                :name="expandedSections.includes(item.label) ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
                class="w-4 h-4 text-zinc-400"
              />
            </button>
            <div
              v-if="expandedSections.includes(item.label)"
              class="ml-4 mt-0.5 space-y-0.5"
            >
              <NuxtLink
                v-for="child in item.children"
                :key="child.to"
                :to="child.to"
                class="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-colors"
                :class="route.path === child.to ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-medium' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'"
              >
                <UIcon
                  :name="child.icon"
                  class="w-4 h-4 shrink-0"
                />
                <span>{{ child.label }}</span>
              </NuxtLink>
            </div>
          </div>

          <!-- Item with children collapsed -->
          <NuxtLink
            v-else-if="item.children && !isSidebarOpen"
            :to="item.to"
            class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="route.path.startsWith(item.to) ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'"
          >
            <UIcon
              :name="item.icon"
              class="w-5 h-5 shrink-0"
            />
          </NuxtLink>

          <!-- Simple item -->
          <NuxtLink
            v-else
            :to="item.disabled ? undefined : item.to"
            class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="[
              route.path.startsWith(item.to) ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800',
              item.disabled ? 'opacity-40 cursor-not-allowed' : ''
            ]"
          >
            <UIcon
              :name="item.icon"
              class="w-5 h-5 shrink-0"
            />
            <span v-if="isSidebarOpen">{{ item.label }}</span>
            <UBadge
              v-if="item.disabled && isSidebarOpen"
              size="xs"
              color="neutral"
              variant="subtle"
              class="ml-auto"
            >
              Soon
            </UBadge>
          </NuxtLink>
        </template>
      </nav>

      <!-- Sidebar toggle -->
      <div class="flex justify-end p-3 border-t border-zinc-200 dark:border-zinc-800">
        <button
          class="flex items-center justify-center p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          @click="isSidebarOpen = !isSidebarOpen"
        >
          <UIcon
            :name="isSidebarOpen ? 'i-lucide-panel-left-close' : 'i-lucide-panel-left-open'"
            class="w-5 h-5"
          />
        </button>
      </div>
    </aside>

    <!-- Main content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <header class="flex items-center justify-between h-16 px-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <UBreadcrumb :items="breadcrumbs" />
      </header>

      <!-- Page content -->
      <main class="flex-1 overflow-y-auto p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
