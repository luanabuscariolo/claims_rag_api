import styles from './StatCard.module.css'

export default function StatCard({ icon, label, value, sub, subType }) {
  return (
    <div className={styles.card}>
      <div className={styles.label}>
        <span className={styles.icon}>{icon}</span>
        {label}
      </div>
      <div className={styles.value}>{value ?? '—'}</div>
      {sub && (
        <div
          className={`${styles.sub} ${
            subType === 'up'   ? styles.up   :
            subType === 'down' ? styles.down : ''
          }`}
        >
          {sub}
        </div>
      )}
    </div>
  )
}
