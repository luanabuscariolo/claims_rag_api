import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <h2 className="text-sm text-gray-500">
            Insurance Claims — Sistema de Gestão com IA
          </h2>
        </header>

        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
