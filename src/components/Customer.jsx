import { useState, useEffect } from 'react';
import { getReadOnlyContract, checkRoles } from '../utils/contract';
import { validateBatchId, validateAddress } from '../utils/validation';
import { useApp } from '../context/AppContext';
import LoadingSpinner from './LoadingSpinner';
import Dashboard from './Dashboard';
import BatchList from './BatchList';
import { QRCodeSVG } from 'qrcode.react';

const Customer = () => {
  const { addNotification } = useApp();
  const [batchId, setBatchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(null);
  const [verifyAddr, setVerifyAddr] = useState('');
  const [verifyResult, setVerifyResult] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [activeTab, setActiveTab] = useState('view'); // 'view', 'verify', 'dashboard'

  // Auto-load from URL params (from QR code scan)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('batchId');
    if (id) {
      setBatchId(id);
      setActiveTab('view');
      setTimeout(() => {
        viewHistory(id);
      }, 500);
    }
  }, []);

  const viewHistory = async (batchIdParam = null) => {
    const batchIdStr = batchIdParam || batchId.trim();

    const batchIdValidation = validateBatchId(batchIdStr);
    if (!batchIdValidation.valid) {
      addNotification(batchIdValidation.error, 'error');
      setHistory(null);
      return;
    }

    setLoading(true);
    setHistory(null);

    try {
      const contract = await getReadOnlyContract();
      const batchIdBigInt = batchIdValidation.batchIdBigInt;

      const [batch, sensors, owners] = await contract.getBatchHistory(batchIdBigInt);

      if (batch.batchId.toString() === '0') {
        addNotification('Batch does not exist.', 'error');
        setLoading(false);
        return;
      }

      let currentOwnerRole = "Unregistered / Unknown";
      try {
        const roles = await checkRoles(batch.currentOwner);
        if (roles.length > 0) {
          currentOwnerRole = roles.join(", ");
        }
      } catch (innerErr) {
        console.error("Error looking up current owner role", innerErr);
      }

      // Generate QR code URL for this batch
      // Use the base path from vite config (for GitHub Pages deployment)
      const basePath = import.meta.env.BASE_URL || '/';
      const qrUrl = `${window.location.origin}${basePath}?batchId=${batchIdBigInt}`;

      setHistory({
        batch,
        sensors,
        owners,
        currentOwnerRole,
        qrUrl,
      });
      
      addNotification('Batch history loaded successfully!', 'success');
    } catch (err) {
      console.error("Error fetching batch history:", err);
      let message = 'Failed to fetch batch history.';
      
      if (err.code === "BAD_DATA") {
        message = "Could not read data for this batch. Make sure you are on the correct network.";
      } else if (err.code === "CALL_EXCEPTION") {
        message = "The batch ID may not exist or the contract rejected the request.";
      } else if (err.message) {
        message = err.message;
      }
      
      addNotification(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const verifyActor = async () => {
    const addressValidation = validateAddress(verifyAddr);
    if (!addressValidation.valid) {
      setVerifyResult(addressValidation.error);
      return;
    }

    setVerifying(true);
    setVerifyResult('');

    try {
      const roles = await checkRoles(addressValidation.address);

      if (roles.length === 0) {
        setVerifyResult(
          `Address ${addressValidation.address} is not registered as a Producer, Transporter, Distributor, or Retailer in this contract.`
        );
      } else {
        setVerifyResult(
          `Address ${addressValidation.address} is a registered: ${roles.join(", ")} (according to on-chain role mappings).`
        );
      }
    } catch (err) {
      console.error("Error verifying actor", err);
      setVerifyResult(`Error: ${err.message || 'Failed to verify actor. Please check network connection.'}`);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div>
      <Dashboard role="customer" />
      
      <div className="card">
        <h3>👤 Customer Portal</h3>
        <div className="note">
          Customers can verify the full history of a product batch. <strong>No MetaMask or wallet connection is required.</strong>
          You can view batch history by entering a Batch ID or by scanning a QR code (which will open this page with the batch ID).
          Data is read directly from the blockchain using public RPC endpoints.
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'view' ? 'active' : ''}`}
            onClick={() => setActiveTab('view')}
          >
            🔍 View Batch History
          </button>
          <button
            className={`tab ${activeTab === 'verify' ? 'active' : ''}`}
            onClick={() => setActiveTab('verify')}
          >
            ✅ Verify Actor
          </button>
          <button
            className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 All Batches
          </button>
        </div>

        {/* View History Tab */}
        {activeTab === 'view' && (
          <div className="tab-content">
            <div className="input-group">
              <label>Batch ID *</label>
              <input
                type="text"
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                placeholder="e.g., 123 or scan QR code from product"
                disabled={loading}
              />
              <small style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                Enter Batch ID manually or scan the QR code on the product (it will open this page automatically)
              </small>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => viewHistory()}
              disabled={loading || !batchId}
            >
              {loading ? 'Loading...' : 'View Batch History'}
            </button>

            {loading && !history && (
              <LoadingSpinner message="Loading batch history..." />
            )}

            {history && (
              <div className="history-container">
                {/* QR Code Section */}
                {history.qrUrl && (
                  <div className="qr-container">
                    <div>
                      <p style={{ marginBottom: '10px', fontWeight: 'bold', textAlign: 'center' }}>
                        📱 Scan to View This Batch
                      </p>
                      <QRCodeSVG value={history.qrUrl} size={200} />
                      <p style={{ marginTop: '10px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
                        Scan this QR code with your phone to view this batch history
                      </p>
                    </div>
                  </div>
                )}

                <div className="history-section">
                  <h4>📦 Product Information</h4>
                  <ul className="history-list">
                    <li className="history-item">
                      <strong>Batch ID:</strong> {history.batch.batchId.toString()}
                    </li>
                    <li className="history-item">
                      <strong>Product:</strong> {history.batch.productName}
                    </li>
                    <li className="history-item">
                      <strong>Quantity:</strong> {history.batch.quantity.toString()}
                    </li>
                    <li className="history-item">
                      <strong>Current Owner:</strong> {history.batch.currentOwner}
                    </li>
                    <li className="history-item">
                      <strong>Current Owner Role:</strong> {history.currentOwnerRole}
                    </li>
                    <li className="history-item">
                      <strong>Arrived at Retailer:</strong> {history.batch.arrived ? '✅ Yes' : '❌ No'}
                    </li>
                    <li className="history-item">
                      <strong>Passed Inspection:</strong> {history.batch.passedInspection ? '✅ Yes' : '❌ No'}
                    </li>
                  </ul>
                </div>

                <div className="history-section">
                  <h4>👥 Ownership History</h4>
                  {history.owners.length > 0 ? (
                    <ul className="history-list">
                      {history.owners.map((owner, idx) => (
                        <li key={idx} className="history-item">
                          <strong>Owner {idx + 1}:</strong> {owner.owner}<br />
                          <strong>Time:</strong> {new Date(Number(owner.timestamp) * 1000).toLocaleString()}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ color: '#666', fontStyle: 'italic' }}>No ownership history available.</p>
                  )}
                </div>

                <div className="history-section">
                  <h4>🌡️ Environmental Logs</h4>
                  {history.sensors.length > 0 ? (
                    <ul className="history-list">
                      {history.sensors.map((sensor, idx) => (
                        <li key={idx} className="history-item">
                          <strong>Reading {idx + 1}:</strong><br />
                          <strong>Temp:</strong> {sensor.temperature.toString()} °C |{' '}
                          <strong>Humidity:</strong> {sensor.humidity.toString()} |{' '}
                          <strong>Location:</strong> {sensor.location}<br />
                          <strong>Time:</strong> {new Date(Number(sensor.timestamp) * 1000).toLocaleString()}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ color: '#666', fontStyle: 'italic' }}>No sensor data available.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Verify Tab */}
        {activeTab === 'verify' && (
          <div className="tab-content">
            <div className="input-group">
              <label>Actor Ethereum Address *</label>
              <input
                type="text"
                value={verifyAddr}
                onChange={(e) => setVerifyAddr(e.target.value)}
                placeholder="0x..."
                disabled={verifying}
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={verifyActor}
              disabled={verifying || !verifyAddr}
            >
              {verifying ? 'Verifying...' : 'Verify Actor Role'}
            </button>
            {verifyResult && (
              <pre className="pre-formatted" style={{ marginTop: '15px' }}>
                {verifyResult}
              </pre>
            )}
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="tab-content">
            <BatchList 
              role="customer" 
              onBatchSelect={(batchId) => {
                setBatchId(batchId);
                setActiveTab('view');
                viewHistory(batchId);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Customer;
