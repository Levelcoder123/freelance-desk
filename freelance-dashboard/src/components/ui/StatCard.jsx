// REPLACE entire file with:
export default function StatCard({ label, value, change, changeDir = 'neutral', icon }) {
  return (
    <div className="stat-card animate-in">
      <div className="stat-card-top">
        <div className="stat-label">{label}</div>
        {icon && <div className="stat-icon">{icon}</div>}
      </div>
      <div className="stat-value">{value}</div>
      {change && (
        <div className={`stat-change ${changeDir}`}>
          {changeDir === 'up'   && '↑ '}
          {changeDir === 'down' && '↓ '}
          {change}
        </div>
      )}
    </div>
  )
}