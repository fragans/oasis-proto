import type { ContactWithDetails } from '~~/shared/types/contact'

export function useContact() {
  async function fetchContact(id: string) {
    return $fetch<ContactWithDetails>(`/api/contacts/${id}`)
  }

  async function createContact(data: Record<string, unknown>) {
    return $fetch('/api/contacts', {
      method: 'POST',
      body: data
    })
  }

  async function updateContact(id: string, data: Record<string, unknown>) {
    return $fetch(`/api/contacts/${id}`, {
      method: 'PUT',
      body: data
    })
  }

  async function deleteContact(id: string) {
    return $fetch(`/api/contacts/${id}`, {
      method: 'DELETE'
    })
  }

  async function bulkImport(contacts: Record<string, unknown>[]) {
    return $fetch('/api/contacts/bulk-import', {
      method: 'POST',
      body: { contacts }
    })
  }

  return {
    fetchContact,
    createContact,
    updateContact,
    deleteContact,
    bulkImport
  }
}
