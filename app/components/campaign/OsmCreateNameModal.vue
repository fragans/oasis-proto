<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false })

const { createCampaign } = useCampaign()
const router = useRouter()
const toast = useToast()

const form = reactive({
  name: ''
})

const saving = ref(false)

const { data: organizationsData } = await useFetch<{ organizations: { id: string }[] }>('/api/organizations')

async function handleCreate() {
  if (!form.name.trim()) return

  saving.value = true
  try {
    const config = useRuntimeConfig()
    let organizationId = config.public.defaultOrganizationId as string

    // Fallback to first available organization if default is 'no-organization' or missing
    if (organizationsData.value?.organizations?.length) {
      const organizationIds = organizationsData.value.organizations.map(t => t.id)
      if (!organizationIds.includes(organizationId)) {
        organizationId = organizationIds[0]!
      }
    }

    const campaign = await createCampaign({
      name: form.name,
      organizationId,
      campaignType: 'popup',
      templateType: 'modal-with-cta-redirect'
    }) as { id: string }

    open.value = false
    form.name = ''

    toast.add({
      title: 'Campaign draft created',
      color: 'success'
    })

    router.push(`/campaigns/on-site-messages/${campaign.id}/wizard/template`)
  } catch (err: unknown) {
    toast.add({
      title: 'Failed to create campaign',
      description: err instanceof Error ? err.message : String(err),
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UModal v-model:open="open">
    <template #header>
      <h3 class="text-lg font-semibold">
        New OSM Campaign
      </h3>
    </template>

    <template #body>
      <div class="space-y-4">
        <UFormField
          label="Campaign Name"
          required
          help="Give your campaign a clear, descriptive name."
        >
          <UInput
            v-model="form.name"
            placeholder="e.g. Ramadan Subscription Promo"
            autofocus
            class="w-full"
            @keyup.enter="handleCreate"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          variant="ghost"
          color="neutral"
          @click="open = false"
        >
          Cancel
        </UButton>
        <UButton
          :loading="saving"
          :disabled="!form.name.trim()"
          @click="handleCreate"
        >
          Next: Choose Template
        </UButton>
      </div>
    </template>
  </UModal>
</template>
