import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { validateBatchId, validateAddress, validateOwnership } from '../utils/validation';
import Dashboard from './Dashboard';
import BatchList from './BatchList';

const Distributor = () => {
  const { contract, account, executeTransaction, addNotification } = useApp();
  const [batchId, setBatchId] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [activeTab, setActiveTab] = useState('transfer'); // 'transfer', 'batches'

  const transfer = async () => {
    if (!contract || !account) {
      addNotification('Please connect your wallet first.', 'error');
      return;
    }

    const batchIdValidation = validateBatchId(batchId);
    if (!batchIdValidation.valid) {
      addNotification(batchIdValidation.error, 'error');
      return;
    }

    const addressValidation = validateAddress(newOwner);
    if (!addressValidation.valid) {
      addNotification(addressValidation.error, 'error');
      return;
    }

    setValidating(true);
    try {
      const ownershipCheck = await validateOwnership(
        contract,
        batchIdValidation.batchIdBigInt,
        account
      );

      if (!ownershipCheck.valid) {
        addNotification(ownershipCheck.error, 'error');
        setValidating(false);
        return;
      }

      setValidating(false);
      setLoading(true);

      await executeTransaction(
        () => contract.transferOwnership(
          batchIdValidation.batchIdBigInt,
          addressValidation.address
        ),
        'Ownership transferred successfully!',
        'Failed to transfer ownership'
      );

      setBatchId('');
      setNewOwner('');
    } catch (error) {
      console.error('Transfer error:', error);
    } finally {
      setLoading(false);
      setValidating(false);
    }
  };

  return (
    <div>
      <Dashboard role="distributor" />
      
      <div className="card">
        <h3>🏭 Distributor Portal</h3>
        <div className="note">
          Transfers batch ownership to the next actor. Only the current owner can perform this action.
          The contract will verify ownership before allowing the transfer.
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'transfer' ? 'active' : ''}`}
            onClick={() => setActiveTab('transfer')}
          >
            🔄 Transfer Ownership
          </button>
          <button
            className={`tab ${activeTab === 'batches' ? 'active' : ''}`}
            onClick={() => setActiveTab('batches')}
          >
            📦 All Batches
          </button>
        </div>

        {/* Transfer Tab */}
        {activeTab === 'transfer' && (
          <div className="tab-content">
            <div className="input-group">
              <label>Batch ID *</label>
              <input
                type="text"
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                placeholder="e.g., 123"
                disabled={loading || validating}
              />
            </div>

            <div className="input-group">
              <label>New Owner (Retailer Address) *</label>
              <input
                type="text"
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value)}
                placeholder="0x..."
                disabled={loading || validating}
              />
              <small style={{ color: '#666', fontSize: '12px' }}>
                Must be a valid Ethereum address
              </small>
            </div>

            <button
              className="btn btn-primary"
              onClick={transfer}
              disabled={loading || validating || !batchId || !newOwner}
            >
              {validating ? 'Validating Ownership...' : loading ? 'Transferring...' : 'Transfer Ownership'}
            </button>
          </div>
        )}

        {/* Batches Tab */}
        {activeTab === 'batches' && (
          <div className="tab-content">
            <BatchList role="distributor" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Distributor;
