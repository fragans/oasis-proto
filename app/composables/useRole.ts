export const useRole = () => {
  const { user } = useUserSession()

  const isSuperAdmin = computed(() => user.value?.role === 'super_admin')
  const isAdminOnly = computed(() => user.value?.role === 'admin')
  const isViewer = computed(() => user.value?.role === 'viewer')

  const isAdmin = computed(() => isSuperAdmin.value || isAdminOnly.value)

  return {
    isSuperAdmin,
    isAdminOnly,
    isViewer,
    isAdmin,
    role: computed(() => user.value?.role)
  }
}
