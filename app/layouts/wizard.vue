<script setup lang="ts">
const route = useRoute()
const campaignId = computed(() => route.params.id as string)

const { campaign, error } = useWizardDraft(campaignId.value)

// Guard: if campaign not found, redirect to list
watchEffect(() => {
  if (error.value && error.value.statusCode === 404) {
    useRouter().push('/campaigns/on-site-messages')
  }
})
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 font-sans">
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <header
        class="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 flex items-center justify-between shrink-0"
      >
        <div class="flex items-center gap-4">
          <UButton
            variant="ghost"
            color="neutral"
            icon="i-lucide-arrow-left"
            to="/campaigns/on-site-messages"
          />
          <div>
            <h1 class="text-sm font-semibold text-zinc-900 dark:text-white truncate max-w-[300px]">
              {{ campaign?.name || 'Loading campaign...' }}
            </h1>
            <p class="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
              Campaign Wizard
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <UBadge
            v-if="campaign"
            color="neutral"
            variant="subtle"
            size="xs"
          >
            {{ campaign.status }}
          </UBadge>
          <UColorModeButton />
        </div>
      </header>

      <!-- Stepper -->
      <CampaignWizardStepper />

      <!-- Content -->
      <main class="flex-1 overflow-y-auto p-8 pb-32">
        <div class="max-w-4xl mx-auto">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>
