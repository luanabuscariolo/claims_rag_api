import { useEffect, useState } from 'react'
import { FileText, CheckCircle, XCircle, Clock } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import StatCard from '../components/StatCard'
import { getClaimStats } from '../services/api'

const PIE_COLORS = {
  pending:   '#f59e0b',
  approved:  '#10b981',
  rejected:  '#ef4444',
  in_review: '#8b5cf6',
}

const STATUS_LABELS = {
  pending:   'Pendente',
  approved:  'Aprovado',
  rejected:  'Rejeitado',
  in_review: 'Em Revisão',
}

export default function Dashboard() {
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getClaimStats()
      .then(res => setStats(res.data.by_status ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="text-gray-400 text-center py-20">Carregando...</div>
  }

  const total = stats.reduce((sum, s) => sum + s.count, 0)

  const chartData = stats.map(s => ({
    name:  STATUS_LABELS[s.status] ?? s.status,
    value: s.count,
    color: PIE_COLORS[s.status] ?? '#94a3b8',
  }))

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total de Sinistros" value={total} icon={FileText} color="blue" />
        <StatCard title="Pendentes"  value={stats.find(s => s.status === 'pending')?.count  ?? 0} icon={Clock}       color="amber" />
        <StatCard title="Aprovados"  value={stats.find(s => s.status === 'approved')?.count ?? 0} icon={CheckCircle} color="green" />
        <StatCard title="Rejeitados" value={stats.find(s => s.status === 'rejected')?.count ?? 0} icon={XCircle}     color="red"   />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-700 mb-4">Distribuição por Status</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%" cy="50%"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value} sinistros`]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
