import React from 'react';

/**
 * StatCard (unificado)
 * Reutiliza estilos existentes: `.stat-card`, `.stat-card-primary|success|warning|danger|info`, etc.
 */
export default function StatCard({
  icon,
  label,
  value,
  color = 'primary',
  subtitle,
  trend, // { type: 'up' | 'down', percent: number, icon?: ReactNode }
  onClick,
  className = '',
}) {
  return (
    <div
      className={[`stat-card stat-card-${color}`, className].filter(Boolean).join(' ')}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? e => {
              if (e.key === 'Enter' || e.key === ' ') onClick(e);
            }
          : undefined
      }
    >
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
        {subtitle ? <p className="stat-subtitle">{subtitle}</p> : null}
        {trend ? (
          <p className={`stat-trend trend-${trend.type}`}>
            {trend.icon ?? (trend.type === 'up' ? '↑' : '↓')} {trend.percent}%
          </p>
        ) : null}
      </div>
    </div>
  );
}

