<script setup lang="ts">
// We keep the standard breadcrumb logic but specialized for the canvas
const route = useRoute()

const breadcrumbs = computed(() => {
  const parts = route.path.split('/').filter(Boolean)
  return parts.map((part, index) => ({
    label: part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' '),
    to: '/' + parts.slice(0, index + 1).join('/')
  }))
})
</script>

<template>
  <div class="flex h-screen overflow-hidden ">
    <main class="flex-1 overflow-y-auto p-6">
      <header class="absolute top-8 left-8 h-14 px-4 flex items-center bg-white dark:bg-zinc-900/50 rounded-lg shadow-md z-10 border border-zinc-200 dark:border-zinc-800 backdrop-blur-sm">
        <div class="flex items-center gap-4 justify-start min-w-1/4">
          <UButton
            icon="i-lucide-arrow-left"
            variant="ghost"
            color="neutral"
            to="/journeys"
          />
          <div class="flex items-center gap-2">
            <UBreadcrumb :items="breadcrumbs" />
            <UColorModeButton />
          </div>
        </div>
      </header>

      <slot />
    </main>
  </div>
</template>
