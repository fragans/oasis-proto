<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false })

const { createCampaign } = useCampaign()
const { session } = useUserSession()
interface Organization {
  id: string
  name: string
  slug: string
}

const activeOrgId = computed(() => session.value?.activeOrganizationId)
const { data: userOrganizations } = useNuxtData<Organization[]>('user-organizations')
const orgIdFromSlug = computed(() => {
  if (!orgSlug.value || !userOrganizations.value) return null
  return userOrganizations.value.find(o => o.slug === orgSlug.value)?.id
})

const targetOrgId = computed(() => activeOrgId.value || orgIdFromSlug.value)

const route = useRoute()
const router = useRouter()
const toast = useToast()
const orgSlug = computed(() => route.params.org as string)

const form = reactive({
  name: ''
})

const saving = ref(false)

async function handleCreate() {
  if (!form.name.trim()) return
  if (!targetOrgId.value) {
    toast.add({
      title: 'No organization selected',
      description: 'Please select an organization before creating a campaign.',
      color: 'warning'
    })
    return
  }

  saving.value = true
  try {
    const campaign = await createCampaign({
      name: form.name,
      organizationId: targetOrgId.value,
      campaignType: 'popup',
      templateType: 'modal-with-cta-redirect'
    })

    if (!campaign?.id) {
      throw new Error('Failed to retrieve new campaign ID')
    }

    open.value = false
    form.name = ''

    toast.add({
      title: 'Campaign draft created',
      color: 'success'
    })

    router.push(`/${orgSlug.value}/campaigns/on-site-messages/${campaign.id}/wizard/template`)
  } catch (err: unknown) {
    console.error('[CreateCampaign] Error:', err)
    toast.add({
      title: 'Failed to create campaign',
      description: err instanceof Error ? err.message : 'An unexpected error occurred',
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
