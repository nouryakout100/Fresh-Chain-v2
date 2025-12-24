import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { validateBatchId } from '../utils/validation';
import Dashboard from './Dashboard';
import BatchList from './BatchList';

const Retailer = () => {
  const { contract, executeTransaction, addNotification } = useApp();
  const [batchId, setBatchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [processingType, setProcessingType] = useState(null);
  const [activeTab, setActiveTab] = useState('inspect'); // 'inspect', 'batches'

  const arrive = async (passed) => {
    if (!contract) {
      addNotification('Please connect your wallet first.', 'error');
      return;
    }

    const batchIdValidation = validateBatchId(batchId);
    if (!batchIdValidation.valid) {
      addNotification(batchIdValidation.error, 'error');
      return;
    }

    setProcessingType(passed ? 'passed' : 'failed');
    setLoading(true);

    try {
      await executeTransaction(
        () => contract.markAsArrived(batchIdValidation.batchIdBigInt, passed),
        `Batch marked as ${passed ? 'passed' : 'failed'} inspection!`,
        `Failed to mark batch as ${passed ? 'passed' : 'failed'}`
      );

      setBatchId('');
    } catch (error) {
      console.error('Mark arrived error:', error);
    } finally {
      setLoading(false);
      setProcessingType(null);
    }
  };

  return (
    <div>
      <Dashboard role="retailer" />
      
      <div className="card">
        <h3>🏪 Retailer Portal</h3>
        <div className="note">
          Performs final inspection and confirms product arrival. Only registered retailers can perform this action.
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'inspect' ? 'active' : ''}`}
            onClick={() => setActiveTab('inspect')}
          >
            ✅ Final Inspection
          </button>
          <button
            className={`tab ${activeTab === 'batches' ? 'active' : ''}`}
            onClick={() => setActiveTab('batches')}
          >
            📦 All Batches
          </button>
        </div>

        {/* Inspect Tab */}
        {activeTab === 'inspect' && (
          <div className="tab-content">
            <div className="input-group">
              <label>Batch ID *</label>
              <input
                type="text"
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                placeholder="e.g., 123"
                disabled={loading}
              />
            </div>

            <div className="button-grid-2">
              <button
                className="btn btn-success"
                onClick={() => arrive(true)}
                disabled={loading || !batchId}
              >
                {loading && processingType === 'passed' ? 'Processing...' : '✅ Inspection Passed'}
              </button>

              <button
                className="btn btn-danger"
                onClick={() => arrive(false)}
                disabled={loading || !batchId}
              >
                {loading && processingType === 'failed' ? 'Processing...' : '❌ Inspection Failed'}
              </button>
            </div>
          </div>
        )}

        {/* Batches Tab */}
        {activeTab === 'batches' && (
          <div className="tab-content">
            <BatchList role="retailer" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Retailer;
