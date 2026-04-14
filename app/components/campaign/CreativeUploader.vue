<script setup lang="ts">
const { upload, uploading, error } = useCreativeUpload()

const emit = defineEmits<{
  uploaded: [creative: { url: string, fileName: string, fileSize: number, mimeType: string }]
}>()

const dragOver = ref(false)
const fileInput = ref<HTMLInputElement>()

function onDrop(e: DragEvent) {
  dragOver.value = false
  const file = e.dataTransfer?.files[0]
  if (file) handleFile(file)
}

function onFileSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) handleFile(file)
}

async function handleFile(file: File) {
  try {
    const result = await upload(file)
    emit('uploaded', result)
  } catch {
    // error is already set in composable
  }
}
</script>

<template>
  <div
    class="border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer"
    :class="dragOver
      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950'
      : 'border-zinc-300 dark:border-zinc-700 hover:border-indigo-400'"
    @dragover.prevent="dragOver = true"
    @dragleave="dragOver = false"
    @drop.prevent="onDrop"
    @click="fileInput?.click()"
  >
    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
      class="hidden"
      @change="onFileSelect"
    >
    <UIcon
      name="i-lucide-upload-cloud"
      class="w-10 h-10 mx-auto mb-3 text-zinc-400"
    />
    <p
      v-if="uploading"
      class="text-sm text-indigo-600 dark:text-indigo-400 font-medium"
    >
      Uploading...
    </p>
    <template v-else>
      <p class="text-sm text-zinc-600 dark:text-zinc-400">
        Drag & drop an image here, or <span class="text-indigo-600 dark:text-indigo-400 font-medium">browse</span>
      </p>
      <p class="text-xs text-zinc-400 mt-1">
        JPG, PNG, GIF, WebP, SVG — max 10MB
      </p>
    </template>
    <p
      v-if="error"
      class="text-xs text-red-500 mt-2"
    >
      {{ error }}
    </p>
  </div>
</template>
