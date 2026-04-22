<script setup lang="ts">
import type { Segment, SegmentRuleGroup, StandardSegmentCategory } from '~~/shared/types/contact'

definePageMeta({ layout: 'default' })

const router = useRouter()
const toast = useToast()

const saving = ref(false)
const form = reactive({
  name: '',
  description: '',
  type: 'static' as 'static' | 'dynamic',
  tags: ''
})
const category = ref<StandardSegmentCategory | null>(null)
const rules = ref<SegmentRuleGroup | null>(null)

watch(category, () => {
  rules.value = null
})

async function onCreate() {
  saving.value = true
  try {
    const created = await $fetch<Segment>('/api/segments', {
      method: 'POST',
      body: {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
        category: form.type === 'dynamic' ? category.value : undefined,
        ...(form.type === 'dynamic' && rules.value ? { rules: rules.value } : {})
      }
    })
    toast.add({ title: 'Segment created', color: 'success' })
    router.push(`/audiences/segments/${created.id}`)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-8">
    <!-- Header -->
    <div>
      <p class="text-sm text-zinc-500">
        Create a new audience segment
      </p>
    </div>

    <!-- Segment Details -->
    <div class="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-6 space-y-5">
      <h2 class="text-lg font-semibold text-zinc-900 dark:text-white">
        Segment Details
      </h2>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Name *</label>
          <UInput
            v-model="form.name"
            placeholder="VIP Subscribers"
            size="md"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Description</label>
          <UInput
            v-model="form.description"
            placeholder="Optional description"
            size="md"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Type</label>
          <div class="flex gap-2">
            <UButton
              label="Static"
              size="sm"
              :variant="form.type === 'static' ? 'solid' : 'outline'"
              :color="form.type === 'static' ? 'primary' : 'neutral'"
              @click="form.type = 'static'"
            />
            <UButton
              label="Dynamic"
              size="sm"
              :variant="form.type === 'dynamic' ? 'solid' : 'outline'"
              :color="form.type === 'dynamic' ? 'primary' : 'neutral'"
              @click="form.type = 'dynamic'"
            />
          </div>
        </div>

        <!-- Standard Segment Category for Dynamic -->
        <div v-if="form.type === 'dynamic'">
          <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Segment Category</label>
          <SegmentCategoryPicker v-model="category" />
        </div>

        <!-- Rule Builder for Dynamic + Category selected -->
        <div v-if="form.type === 'dynamic' && category">
          <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Rules</label>
          <SegmentRuleBuilder
            v-model="rules"
            :category="category"
          />
        </div>
      </div>
    </div>

    <!-- Tags -->
    <div class="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-6 space-y-5">
      <h2 class="text-lg font-semibold text-zinc-900 dark:text-white">
        Tags
      </h2>

      <div>
        <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Tags</label>
        <UInput
          v-model="form.tags"
          placeholder="premium, newsletter"
          size="md"
          hint="Comma-separated"
        />
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-end gap-3 pb-8">
      <UButton
        variant="ghost"
        color="neutral"
        label="Cancel"
        to="/audiences/segments"
      />
      <UButton
        label="Create Segment"
        color="primary"
        icon="i-lucide-plus"
        :loading="saving"
        :disabled="!form.name"
        @click="onCreate"
      />
    </div>
  </div>
</template>
