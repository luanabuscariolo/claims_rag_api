import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// ── Claims ──────────────────────────────────────────────────────────────────

export const getClaims = (params = {}) =>
  api.get('/claims', { params })

export const getClaimById = (id) =>
  api.get(`/claims/${id}`)

export const createClaim = (data) =>
  api.post('/claims', data)

export const updateClaimStatus = (id, data) =>
  api.patch(`/claims/${id}/status`, data)

export const deleteClaim = (id) =>
  api.delete(`/claims/${id}`)

export const getClaimStats = () =>
  api.get('/claims/stats/summary')

// ── RAG / Perguntas ─────────────────────────────────────────────────────────

export const askQuestion = (question, policyType = null) =>
  api.post('/ask', { question, policy_type: policyType })

// ── Documentos ──────────────────────────────────────────────────────────────

export const ingestSeedDocuments = () =>
  api.post('/documents/ingest/seed')

export const ingestText = (content, sourceName, policyType = 'general') =>
  api.post('/documents/ingest', { content, source_name: sourceName, policy_type: policyType })

export const ingestFile = (file, policyType = 'general') => {
  const form = new FormData()
  form.append('file', file)
  form.append('policy_type', policyType)
  return api.post('/documents/ingest/file', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const getDocumentStats = () =>
  api.get('/documents/stats')

// ── RAG Debug ───────────────────────────────────────────────────────────────

export const retrieveChunks = (question, policyType = null) =>
  api.get('/ask/retrieve', { params: { question, policy_type: policyType } })

// ── Health ───────────────────────────────────────────────────────────────────

export const checkHealth = () =>
  api.get('/health')
