import React from 'react';

const RecentHistory = ({ history }) => {
  if (history.length === 0) {
    return (
      <div className="card recent-history-card">
        <p>No hay historial reciente.</p>
      </div>
    );
  }

  return (
    <div className="card recent-history-card">
      <div className="recent-history-list">
        {history.map((item) => (
          <div key={item.id} className="history-item">
            <div>
              <strong>{item.pet}</strong> — {item.service}
            </div>
            <div>
              {item.date} <span className="status-badge">{item.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentHistory;
