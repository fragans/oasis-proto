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
    } catch (err) {
      console.log(err)
      error.value = 'Upload failed'
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
