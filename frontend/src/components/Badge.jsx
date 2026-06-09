import styles from './Badge.module.css'

const STATUS_MAP = {
  pending:   { label: 'Pendente',   cls: 'pending'  },
  approved:  { label: 'Aprovado',   cls: 'approved' },
  rejected:  { label: 'Rejeitado',  cls: 'rejected' },
  in_review: { label: 'Em Revisão', cls: 'review'   },
}

export default function Badge({ status }) {
  const { label, cls } = STATUS_MAP[status] ?? { label: status, cls: 'neutral' }
  return (
    <span className={`${styles.badge} ${styles[cls]}`}>
      {label}
    </span>
  )
}
