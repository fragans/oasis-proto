export function useCreativeUpload() {
  const uploading = ref(false)
  const error = ref<string | null>(null)

  async function upload(file: File) {
    uploading.value = true
    error.value = null

    try {
      const formData = new FormData()
      formData.append('file', file)

      const result = await $fetch<{
        url: string
        fileName: string
        fileSize: number
        mimeType: string
      }>('/api/upload/creative', {
        method: 'POST',
        body: formData
      })

      return result
    } catch (err: any) {
      error.value = err.data?.message || err.message || 'Upload failed'
      throw err
    } finally {
      uploading.value = false
    }
  }

  return {
    upload,
    uploading,
    error
  }
}
