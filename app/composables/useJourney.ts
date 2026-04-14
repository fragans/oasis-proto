import type { JourneyStatus, JourneyWithGraph } from '~~/shared/types/journey'

export function useJourney() {
  async function fetchJourney(id: string) {
    return $fetch<JourneyWithGraph & { availableTransitions: JourneyStatus[], isEditable: boolean }>(`/api/journeys/${id}`)
  }

  async function createJourney(data: {
    name: string
    description?: string
    triggerType?: string
    triggerConfig?: Record<string, unknown>
    segmentId?: string
    quietHoursStart?: string
    quietHoursEnd?: string
    rateLimitPerContact?: number
    rateLimitWindow?: string
  }) {
    return $fetch('/api/journeys', {
      method: 'POST',
      body: data
    })
  }

  async function updateJourney(id: string, data: Record<string, unknown>) {
    return $fetch(`/api/journeys/${id}`, {
      method: 'PUT',
      body: data
    })
  }

  async function deleteJourney(id: string) {
    return $fetch(`/api/journeys/${id}`, {
      method: 'DELETE'
    })
  }

  async function changeStatus(id: string, status: JourneyStatus) {
    return $fetch(`/api/journeys/${id}/status`, {
      method: 'PATCH',
      body: { status }
    })
  }

  async function saveGraph(id: string, graph: {
    nodes: { id: string, type: string, label?: string, config: Record<string, unknown>, positionX: number, positionY: number }[]
    edges: { id: string, sourceNodeId: string, targetNodeId: string, sourceHandle?: string, label?: string }[]
  }) {
    return $fetch(`/api/journeys/${id}/graph`, {
      method: 'PUT',
      body: graph
    })
  }

  async function enrollContacts(id: string, contactIds: string[], metadata?: Record<string, unknown>) {
    return $fetch(`/api/journeys/${id}/enroll`, {
      method: 'POST',
      body: { contactIds, metadata }
    })
  }

  return {
    fetchJourney,
    createJourney,
    updateJourney,
    deleteJourney,
    changeStatus,
    saveGraph,
    enrollContacts
  }
}
