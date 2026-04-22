<script setup lang="ts">
const props = defineProps<{
  html: string
  campaignType?: string
}>()

const iframe = ref<HTMLIFrameElement | null>(null)

const srcdoc = computed(() => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            margin: 0;
            padding: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f8fafc;
            font-family: system-ui, -apple-system, sans-serif;
            overflow: hidden;
          }
          .preview-container {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
          }
          /* Ensure fixed/absolute items in templates are visible in the preview */
          .oasis-banner, .oasis-rating, .oasis-modal {
            position: relative !important;
            bottom: auto !important;
            left: auto !important;
            right: auto !important;
            top: auto !important;
            transform: none !important;
            margin: 0 auto !important;
          }
          .oasis-modal {
            background: none !important;
            position: relative !important;
            inset: auto !important;
            display: block !important;
          }
          .oasis-modal > div {
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1) !important;
            margin: 0 auto !important;
          }
        </style>
      </head>
      <body>
        <div class="preview-container">
          ${props.html}
        </div>
      </body>
    </html>
  `
})
</script>

<template>
  <div class="relative w-full h-full bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col shadow-sm">
    <!-- Browser Header -->
    <div class="h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center px-4 gap-4">
      <div class="flex gap-1.5">
        <div class="w-3 h-3 rounded-full bg-zinc-200 dark:bg-zinc-700" />
        <div class="w-3 h-3 rounded-full bg-zinc-200 dark:bg-zinc-700" />
        <div class="w-3 h-3 rounded-full bg-zinc-200 dark:bg-zinc-700" />
      </div>

      <div class="flex-1 bg-white dark:bg-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-700 h-7 flex items-center px-3 gap-2">
        <UIcon
          name="i-lucide-lock"
          class="w-3 h-3 text-zinc-400"
        />
        <span class="text-[10px] text-zinc-400 font-medium truncate">your-website.com</span>
      </div>

      <div class="flex items-center gap-3">
        <div class="flex items-center gap-1.5 p-1 px-2 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
          <UIcon
            name="i-lucide-monitor"
            class="w-3.5 h-3.5 text-zinc-500"
          />
          <span class="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Preview</span>
        </div>
      </div>
    </div>

    <!-- Iframe Content -->
    <div class="flex-1 relative bg-zinc-100/50 dark:bg-zinc-950/20">
      <iframe
        ref="iframe"
        :srcdoc="srcdoc"
        class="w-full h-full border-none"
        sandbox="allow-scripts"
      />
    </div>
  </div>
</template>
