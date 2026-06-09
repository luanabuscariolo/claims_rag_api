import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FileText, Plus, MessageSquare } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard'    },
  { to: '/claims',    icon: FileText,        label: 'Sinistros'    },
  { to: '/new-claim', icon: Plus,            label: 'Novo Sinistro' },
  { to: '/ask',       icon: MessageSquare,   label: 'Perguntar'    },
]

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white flex flex-col">
      <div className="px-6 py-5 border-b border-slate-700">
        <h1 className="text-lg font-bold text-white">Insurance RAG</h1>
        <p className="text-xs text-slate-400 mt-0.5">Gestão de Sinistros</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
               ${isActive
                 ? 'bg-blue-600 text-white'
                 : 'text-slate-400 hover:bg-slate-800 hover:text-white'
               }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-6 py-4 border-t border-slate-700">
        <p className="text-xs text-slate-500">FastAPI + ChromaDB + LLM</p>
      </div>
    </aside>
  )
}
