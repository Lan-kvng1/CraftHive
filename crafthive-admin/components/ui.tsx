import { ReactNode } from 'react'

export function Avatar({
  initials,
  src,
  size = 'sm',
  color = 'navy',
}: {
  initials: string
  src?: string
  size?: 'sm' | 'md' | 'lg'
  color?: 'navy' | 'gold'
}) {
  const sizes = { sm: 32, md: 40, lg: 56 }
  const fontSize = { sm: 12, md: 14, lg: 16 }
  const bg = color === 'gold' ? '#FFB800' : '#1B2B6B'
  const fg = color === 'gold' ? '#1B2B6B' : '#fff'
  const s = sizes[size]

  if (src) {
    return (
      <img 
        src={src} 
        alt={initials} 
        style={{ 
          width: s, height: s, borderRadius: s, 
          objectFit: 'cover', flexShrink: 0 
        }} 
      />
    )
  }

  return (
    <div style={{
      width: s, height: s, borderRadius: s,
      background: bg, color: fg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 600, fontSize: fontSize[size],
      flexShrink: 0, fontFamily: 'monospace',
    }}>
      {initials}
    </div>
  )
}

export function Badge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    Active:       { bg: '#dcfce7', color: '#15803d' },
    Approved:     { bg: '#dcfce7', color: '#15803d' },
    Completed:    { bg: '#dcfce7', color: '#15803d' },
    Success:      { bg: '#dcfce7', color: '#15803d' },
    Released:     { bg: '#dcfce7', color: '#15803d' },
    Verified:     { bg: '#dcfce7', color: '#15803d' },
    Published:    { bg: '#dcfce7', color: '#15803d' },
    Resolved:     { bg: '#dcfce7', color: '#15803d' },
    Paid:         { bg: '#dcfce7', color: '#15803d' },
    Suspended:    { bg: '#fee2e2', color: '#dc2626' },
    Rejected:     { bg: '#fee2e2', color: '#dc2626' },
    Failed:       { bg: '#fee2e2', color: '#dc2626' },
    Refunded:     { bg: '#fee2e2', color: '#dc2626' },
    Cancelled:    { bg: '#fee2e2', color: '#dc2626' },
    Flagged:      { bg: '#fee2e2', color: '#dc2626' },
    Open:         { bg: '#fee2e2', color: '#dc2626' },
    High:         { bg: '#fee2e2', color: '#dc2626' },
    Pending:      { bg: '#fef9c3', color: '#a16207' },
    Medium:       { bg: '#fef9c3', color: '#a16207' },
    Processing:   { bg: '#dbeafe', color: '#1d4ed8' },
    'In Progress':{ bg: '#dbeafe', color: '#1d4ed8' },
    Closed:       { bg: '#f3f4f6', color: '#6b7280' },
    Low:          { bg: '#f3f4f6', color: '#6b7280' },
  }
  const style = map[status] ?? { bg: '#f3f4f6', color: '#6b7280' }
  return (
    <span style={{
      background: style.bg, color: style.color,
      padding: '2px 10px', borderRadius: 20,
      fontSize: 12, fontWeight: 600,
      display: 'inline-flex', alignItems: 'center',
    }}>
      {status}
    </span>
  )
}

export function StatCard({
  label, value, sub, trend, icon, accent = false,
}: {
  label: string
  value: string
  sub: string
  trend?: { dir: 'up' | 'down'; val: string }
  icon: string
  accent?: boolean
}) {
  return (
    <div style={{
      background: accent ? '#1B2B6B' : '#fff',
      border: accent ? 'none' : '1px solid #E8EDF8',
      borderRadius: 12, padding: '20px',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: accent ? 'rgba(255,255,255,0.1)' : '#EEF1FB',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>
          {icon}
        </div>
        {trend && (
          <span style={{
            fontSize: 12, fontWeight: 600,
            color: trend.dir === 'up' ? '#16a34a' : '#dc2626',
            display: 'flex', alignItems: 'center', gap: 2,
          }}>
            {trend.dir === 'up' ? '↑' : '↓'} {trend.val}
          </span>
        )}
      </div>
      <div>
        <p style={{
          fontSize: 24, fontWeight: 700,
          color: accent ? '#fff' : '#1B2B6B',
          letterSpacing: '-0.5px',
        }}>
          {value}
        </p>
        <p style={{ fontSize: 12, color: accent ? 'rgba(255,255,255,0.6)' : '#6B7494', marginTop: 2 }}>
          {label}
        </p>
      </div>
      <p style={{ fontSize: 12, color: accent ? 'rgba(255,255,255,0.5)' : '#6B7494' }}>
        {sub}
      </p>
    </div>
  )
}

export function Card({
  children,
  style,
}: {
  children: ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #E8EDF8',
      borderRadius: 12,
      ...style,
    }}>
      {children}
    </div>
  )
}

export function Table({
  headers,
  children,
}: {
  headers: string[]
  children: ReactNode
}) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ background: '#F5F7FF', borderBottom: '1px solid #E8EDF8' }}>
            {headers.map(h => (
              <th key={h} style={{
                textAlign: 'left', padding: '12px 16px',
                fontSize: 11, fontWeight: 700,
                color: '#6B7494', textTransform: 'uppercase',
                letterSpacing: '0.05em', whiteSpace: 'nowrap',
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export function TR({
  children,
  onClick,
}: {
  children: ReactNode
  onClick?: () => void
}) {
  return (
    <tr
      onClick={onClick}
      style={{
        borderBottom: '1px solid #E8EDF8',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => {
        if (onClick) (e.currentTarget as HTMLElement).style.background = '#F5F7FF'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = 'transparent'
      }}
    >
      {children}
    </tr>
  )
}

export function TD({
  children,
  mono,
  style,
}: {
  children: ReactNode
  mono?: boolean
  style?: React.CSSProperties
}) {
  return (
    <td style={{
      padding: '12px 16px',
      fontFamily: mono ? 'monospace' : 'inherit',
      fontSize: mono ? 12 : 14,
      color: '#1B2B6B',
      verticalAlign: 'middle',
      ...style,
    }}>
      {children}
    </td>
  )
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', marginBottom: 20,
    }}>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1B2B6B' }}>{title}</h2>
        {subtitle && (
          <p style={{ fontSize: 14, color: '#6B7494', marginTop: 2 }}>{subtitle}</p>
        )}
      </div>
      {actions && (
        <div style={{ display: 'flex', gap: 8 }}>{actions}</div>
      )}
    </div>
  )
}

export function Btn({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled,
  style,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger' | 'gold' | 'ghost'
  size?: 'sm' | 'md'
  disabled?: boolean
  style?: React.CSSProperties
}) {
  const variants = {
    primary:   { background: '#1B2B6B', color: '#fff', border: 'none' },
    secondary: { background: '#fff', color: '#6B7494', border: '1px solid #E8EDF8' },
    danger:    { background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' },
    gold:      { background: '#FFB800', color: '#1B2B6B', border: 'none' },
    ghost:     { background: '#F5F7FF', color: '#6B7494', border: 'none' },
  }
  const sizes = {
    sm: { padding: '6px 12px', fontSize: 12 },
    md: { padding: '8px 16px', fontSize: 14 },
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        borderRadius: 8, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 6,
        transition: 'opacity 0.15s',
        ...variants[variant], ...sizes[size], ...style,
      }}
    >
      {children}
    </button>
  )
}

export function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  style,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  style?: React.CSSProperties
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        background: '#F5F7FF', border: '1px solid #E8EDF8',
        borderRadius: 8, padding: '8px 12px', fontSize: 14,
        color: '#1B2B6B', outline: 'none', width: '100%',
        ...style,
      }}
    />
  )
}

export function Modal({
  title,
  children,
  onClose,
}: {
  title: string
  children: ReactNode
  onClose: () => void
}) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
        zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff', borderRadius: 16, padding: 24,
          width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1B2B6B', marginBottom: 16 }}>
          {title}
        </h3>
        {children}
      </div>
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  message,
}: {
  icon: ReactNode
  title: string
  message: string
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '80px 40px', textAlign: 'center',
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 16,
        background: 'rgba(255,184,0,0.1)', border: '1px solid rgba(255,184,0,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#FFB800', marginBottom: 16, fontSize: 24,
      }}>
        {typeof icon === 'string' ? (
          <span style={{ fontSize: 28 }}>{icon}</span>
        ) : (
          icon
        )}
      </div>
      <p style={{ fontSize: 18, fontWeight: 800, color: '#0A1628', marginBottom: 8 }}>{title}</p>
      <p style={{ fontSize: 14, color: '#64748B', maxWidth: 320, lineHeight: 1.6 }}>{message}</p>
    </div>
  )
}