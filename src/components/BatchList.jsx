import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { getReadOnlyContract } from '../utils/contract';
import { formatAddress } from '../utils/contract';
import LoadingSpinner from './LoadingSpinner';
import './BatchList.css';

const BatchList = ({ role, onBatchSelect }) => {
  const { addNotification } = useApp();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const loadBatches = useCallback(async () => {
    setLoading(true);
    try {
      const contract = await getReadOnlyContract();
      const batchList = [];
      
      // Much more aggressive: Check only first 50 batches, stop after 5 consecutive empty
      const maxRange = 50;
      let consecutiveEmpty = 0;
      const maxConsecutiveEmpty = 5;
      
      for (let i = 1; i <= maxRange; i++) {
        try {
          const batch = await contract.batches(i);
          if (batch.batchId.toString() !== '0') {
            batchList.push({
              batchId: batch.batchId.toString(),
              productName: batch.productName,
              quantity: batch.quantity.toString(),
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
      
      setBatches(batchList);
    } catch (error) {
      console.error('Error loading batches:', error);
      addNotification('Failed to load batches. Please check your network connection.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  const filteredBatches = batches.filter(batch => {
    const search = searchTerm.toLowerCase();
    return (
      batch.batchId.toLowerCase().includes(search) ||
      batch.productName.toLowerCase().includes(search) ||
      batch.currentOwner.toLowerCase().includes(search)
    );
  });

  return (
    <div className="batch-list-container">
      <div className="batch-list-header">
        <h3>📦 Batch List</h3>
        <div className="batch-list-search">
          <input
            type="text"
            placeholder="Search by Batch ID, Product, or Owner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="batch-search-input"
          />
        </div>
        <button 
          className="btn btn-primary" 
          onClick={loadBatches} 
          disabled={loading}
          style={{ width: 'auto', padding: '8px 16px' }}
        >
          {loading ? '⏳ Loading...' : '🔄 Refresh'}
        </button>
      </div>

      {loading && batches.length === 0 ? (
        <LoadingSpinner message="Loading batches..." />
      ) : filteredBatches.length === 0 ? (
        <div className="batch-list-empty">
          <p>{searchTerm ? 'No batches match your search.' : batches.length === 0 ? 'No batches found. Create your first batch!' : 'No batches match your search criteria.'}</p>
        </div>
      ) : (
        <div className="batch-list-grid">
          {filteredBatches.map((batch) => (
            <div
              key={batch.batchId}
              className="batch-card"
              onClick={() => onBatchSelect && onBatchSelect(batch.batchId)}
            >
              <div className="batch-card-header">
                <span className="batch-id">#{batch.batchId}</span>
                <span className={`batch-status ${batch.arrived ? 'arrived' : 'in-transit'}`}>
                  {batch.arrived ? '✅ Arrived' : '🚚 In Transit'}
                </span>
              </div>
              <div className="batch-card-body">
                <h4>{batch.productName}</h4>
                <p className="batch-quantity">Quantity: {batch.quantity}</p>
                <p className="batch-owner">Owner: {formatAddress(batch.currentOwner)}</p>
                {batch.arrived && (
                  <p className={`batch-inspection ${batch.passedInspection ? 'passed' : 'failed'}`}>
                    Inspection: {batch.passedInspection ? '✅ Passed' : '❌ Failed'}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BatchList;
