import { useEffect, useState } from 'react'
import { NavLink, Outlet, Link } from 'react-router-dom'
import { checkHealth } from '../services/api'
import styles from './ClientLayout.module.css'

const NAV = [
  { to: '/client/my-claims', icon: '📄', label: 'Meus Sinistros' },
  { to: '/client/new-claim', icon: '➕', label: 'Abrir Sinistro'  },
  { to: '/client/ask',       icon: '💬', label: 'Assistente IA'  },
]

export default function ClientLayout() {
  const [apiOnline, setApiOnline] = useState(null)

  useEffect(() => {
    checkHealth()
      .then(() => setApiOnline(true))
      .catch(() => setApiOnline(false))
    const id = setInterval(() => {
      checkHealth().then(() => setApiOnline(true)).catch(() => setApiOnline(false))
    }, 30000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>👤</div>
          <div className={styles.logoTitle}>Meu Seguro Horizonte</div>
          <div className={styles.logoRole}>Área do Cliente</div>
        </div>

        <nav className={styles.nav}>
          <div className={styles.navLabel}>Menu</div>
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              <span className={styles.navIcon}>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.footer}>
          <div className={styles.footerApi}>Powered by Horizonte</div>
          <div className={styles.healthText}>
            <span className={`${styles.healthDot} ${apiOnline === false ? styles.healthDotOffline : ''}`} />
            Serviço {apiOnline === null ? 'verificando…' : apiOnline ? 'disponível' : 'indisponível'}
          </div>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <span className={styles.topbarTitle}>Portal do Cliente</span>
          <Link to="/" className={styles.topbarBack}>← Trocar perfil</Link>
        </header>
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
