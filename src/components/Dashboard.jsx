import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { getReadOnlyContract } from '../utils/contract';
import LoadingSpinner from './LoadingSpinner';
import './Dashboard.css';

const Dashboard = ({ role }) => {
  const { account, addNotification } = useApp();
  const [stats, setStats] = useState({
    totalBatches: 0,
    myBatches: 0,
    inTransit: 0,
    arrived: 0,
    passedInspection: 0,
    failedInspection: 0,
  });
  const [loading, setLoading] = useState(false);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const contract = await getReadOnlyContract();
      const statsData = {
        totalBatches: 0,
        myBatches: 0,
        inTransit: 0,
        arrived: 0,
        passedInspection: 0,
        failedInspection: 0,
      };

      // Much more aggressive early exit - check only first 50 batches
      // Stop after 5 consecutive empty batches
      const maxRange = 50;
      const batches = [];
      let consecutiveEmpty = 0;
      const maxConsecutiveEmpty = 5;

      for (let i = 1; i <= maxRange; i++) {
        try {
          const batch = await contract.batches(i);
          if (batch.batchId.toString() !== '0') {
            batches.push({
              batchId: batch.batchId.toString(),
              currentOwner: batch.currentOwner,
              arrived: batch.arrived,
              passedInspection: batch.passedInspection,
            });
            consecutiveEmpty = 0;
          } else {
            consecutiveEmpty++;
            if (consecutiveEmpty >= maxConsecutiveEmpty) {
              break;
            }
          }
        } catch (err) {
          consecutiveEmpty++;
          if (consecutiveEmpty >= maxConsecutiveEmpty) {
            break;
          }
        }
      }

      statsData.totalBatches = batches.length;
      
      if (account) {
        const accountLower = account.toLowerCase();
        statsData.myBatches = batches.filter(
          b => b.currentOwner.toLowerCase() === accountLower
        ).length;
      }

      statsData.inTransit = batches.filter(b => !b.arrived).length;
      statsData.arrived = batches.filter(b => b.arrived).length;
      statsData.passedInspection = batches.filter(b => b.passedInspection).length;
      statsData.failedInspection = batches.filter(b => b.arrived && !b.passedInspection).length;

      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
      // Keep existing stats on error, don't reset
    } finally {
      setLoading(false);
    }
  }, [account, addNotification]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>📊 Dashboard</h2>
        <button 
          className="btn btn-primary" 
          onClick={loadStats} 
          disabled={loading}
          style={{ width: 'auto', padding: '8px 16px' }}
        >
          {loading ? '⏳ Loading...' : '🔄 Refresh'}
        </button>
      </div>

      {loading && stats.totalBatches === 0 ? (
        <LoadingSpinner message="Loading dashboard..." />
      ) : (
        <div className="dashboard-grid">
          <div className="stat-card stat-primary">
            <div className="stat-icon">📦</div>
            <div className="stat-content">
              <h3>{stats.totalBatches}</h3>
              <p>Total Batches</p>
            </div>
          </div>

          {account && (
            <div className="stat-card stat-info">
              <div className="stat-icon">👤</div>
              <div className="stat-content">
                <h3>{stats.myBatches}</h3>
                <p>My Batches</p>
              </div>
            </div>
          )}

          <div className="stat-card stat-warning">
            <div className="stat-icon">🚚</div>
            <div className="stat-content">
              <h3>{stats.inTransit}</h3>
              <p>In Transit</p>
            </div>
          </div>

          <div className="stat-card stat-success">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{stats.arrived}</h3>
              <p>Arrived</p>
            </div>
          </div>

          <div className="stat-card stat-success-light">
            <div className="stat-icon">✓</div>
            <div className="stat-content">
              <h3>{stats.passedInspection}</h3>
              <p>Passed Inspection</p>
            </div>
          </div>

          <div className="stat-card stat-danger">
            <div className="stat-icon">❌</div>
            <div className="stat-content">
              <h3>{stats.failedInspection}</h3>
              <p>Failed Inspection</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
