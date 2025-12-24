import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useApp } from '../context/AppContext';
import { 
  validateBatchId, 
  validateProductName, 
  validateQuantity,
  validateBatchDoesNotExist 
} from '../utils/validation';
import Dashboard from './Dashboard';
import BatchList from './BatchList';

const Producer = () => {
  const { contract, executeTransaction, addNotification } = useApp();
  const [batchId, setBatchId] = useState('');
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const [activeTab, setActiveTab] = useState('create'); // 'create', 'batches'

  const createBatch = async () => {
    if (!contract) {
      addNotification('Please connect your wallet first.', 'error');
      return;
    }

    const batchIdValidation = validateBatchId(batchId);
    if (!batchIdValidation.valid) {
      addNotification(batchIdValidation.error, 'error');
      return;
    }

    const productNameValidation = validateProductName(productName);
    if (!productNameValidation.valid) {
      addNotification(productNameValidation.error, 'error');
      return;
    }

    const quantityValidation = validateQuantity(quantity);
    if (!quantityValidation.valid) {
      addNotification(quantityValidation.error, 'error');
      return;
    }

    setLoading(true);
    try {
      const batchExistsCheck = await validateBatchDoesNotExist(
        contract, 
        batchIdValidation.batchIdBigInt
      );
      
      if (!batchExistsCheck.valid) {
        addNotification(batchExistsCheck.error, 'error');
        setLoading(false);
        return;
      }

      await executeTransaction(
        () => contract.createBatch(
          batchIdValidation.batchIdBigInt,
          productNameValidation.productName,
          quantityValidation.quantityBigInt
        ),
        'Batch created successfully!',
        'Failed to create batch'
      );

      const url = `${window.location.origin}${window.location.pathname}?batchId=${batchIdValidation.batchId}`;
      setQrUrl(url);
      
      setBatchId('');
      setProductName('');
      setQuantity('');
    } catch (error) {
      console.error('Create batch error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Dashboard role="producer" />
      
      <div className="card">
        <h3>🌱 Producer Portal</h3>
        <div className="note">
          Creates new batches and becomes the initial owner. Batch IDs must be unique.
          The contract will reject duplicate batch IDs.
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            ➕ Create Batch
          </button>
          <button
            className={`tab ${activeTab === 'batches' ? 'active' : ''}`}
            onClick={() => setActiveTab('batches')}
          >
            📦 My Batches
          </button>
        </div>

        {/* Create Tab */}
        {activeTab === 'create' && (
          <div className="tab-content">
            <div className="input-group">
              <label>Batch ID (number) *</label>
              <input
                type="text"
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                placeholder="e.g., 123"
                disabled={loading}
              />
              <small style={{ color: '#666', fontSize: '12px' }}>
                Must be a unique positive integer
              </small>
            </div>

            <div className="input-group">
              <label>Product Name *</label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g., Organic Tomatoes"
                disabled={loading}
                maxLength={100}
              />
              <small style={{ color: '#666', fontSize: '12px' }}>
                Max 100 characters
              </small>
            </div>

            <div className="input-group">
              <label>Quantity *</label>
              <input
                type="text"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g., 100"
                disabled={loading}
              />
              <small style={{ color: '#666', fontSize: '12px' }}>
                Must be a positive integer
              </small>
            </div>

            <button
              className="btn btn-primary"
              onClick={createBatch}
              disabled={loading || !batchId || !productName || !quantity}
            >
              {loading ? 'Creating Batch...' : 'Create Batch'}
            </button>

            {qrUrl && (
              <div className="qr-container">
                <div>
                  <p style={{ marginBottom: '10px', fontWeight: 'bold' }}>Batch QR Code</p>
                  <QRCodeSVG value={qrUrl} size={200} />
                  <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                    Share this QR code for batch tracking
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Batches Tab */}
        {activeTab === 'batches' && (
          <div className="tab-content">
            <BatchList role="producer" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Producer;
