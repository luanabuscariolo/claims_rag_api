import { useEffect, useState } from 'react'
import { Trash2, RefreshCw } from 'lucide-react'
import { getClaims, deleteClaim, updateClaimStatus } from '../services/api'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendente' },
  { value: 'in_review', label: 'Em Revisão' },
  { value: 'approved', label: 'Aprovado' },
  { value: 'rejected', label: 'Rejeitado' },
]

export default function Claims() {
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({
    status: '',
    claim_type: '',
    policy_number: '',
  })

  const loadClaims = () => {
    setLoading(true)
    getClaims(filter)
      .then((res) => setClaims(res.data.items ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadClaims()
  }, [filter])

  const handleDelete = async (id) => {
    if (!window.confirm('Remover este sinistro?')) return
    await deleteClaim(id)
    loadClaims()
  }

  const handleStatusChange = async (id, newStatus) => {
    await updateClaimStatus(id, { status: newStatus })
    loadClaims()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sinistros</h1>
        <button
          onClick={loadClaims}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"
        >
          <RefreshCw size={16} /> Atualizar
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 flex flex-wrap gap-4">
        <input
          value={filter.policy_number}
          onChange={(e) =>
            setFilter((f) => ({ ...f, policy_number: e.target.value }))
          }
          placeholder="Número da apólice"
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <select
          value={filter.status}
          onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os status</option>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <select
          value={filter.claim_type}
          onChange={(e) =>
            setFilter((f) => ({ ...f, claim_type: e.target.value }))
          }
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os tipos</option>
          <option value="auto">Auto</option>
          <option value="home">Residencial</option>
          <option value="health">Saúde</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Carregando...</div>
      ) : claims.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          Nenhum sinistro encontrado.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['ID', 'Apólice', 'Segurado', 'Tipo', 'Valor Solicitado', 'Status', 'Ações'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {claims.map((claim) => (
                <tr key={claim.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400 font-mono">#{claim.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-700">
                    {claim.policy_number}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{claim.claimant_name}</td>
                  <td className="px-4 py-3 capitalize text-gray-600">
                    {claim.claim_type}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(claim.amount_claimed)}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={claim.status}
                      onChange={(e) => handleStatusChange(claim.id, e.target.value)}
                      className="border-0 bg-transparent text-sm focus:outline-none cursor-pointer"
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(claim.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Excluir sinistro"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}