import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  validateBatchId, 
  validateTemperature, 
  validateHumidity,
  validateLocation 
} from '../utils/validation';
import Dashboard from './Dashboard';
import BatchList from './BatchList';

const Transporter = () => {
  const { contract, executeTransaction, addNotification } = useApp();
  const [batchId, setBatchId] = useState('');
  const [temperature, setTemperature] = useState('');
  const [humidity, setHumidity] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('add'); // 'add', 'batches'

  const addSensor = async () => {
    if (!contract) {
      addNotification('Please connect your wallet first.', 'error');
      return;
    }

    const batchIdValidation = validateBatchId(batchId);
    if (!batchIdValidation.valid) {
      addNotification(batchIdValidation.error, 'error');
      return;
    }

    const tempValidation = validateTemperature(temperature);
    if (!tempValidation.valid) {
      addNotification(tempValidation.error, 'error');
      return;
    }

    const humValidation = validateHumidity(humidity);
    if (!humValidation.valid) {
      addNotification(humValidation.error, 'error');
      return;
    }

    const locationValidation = validateLocation(location);
    if (!locationValidation.valid) {
      addNotification(locationValidation.error, 'error');
      return;
    }

    setLoading(true);

    try {
      await executeTransaction(
        () => contract.addSensorData(
          batchIdValidation.batchIdBigInt,
          tempValidation.temperatureBigInt,
          humValidation.humidityBigInt,
          locationValidation.location
        ),
        'Sensor data added successfully!',
        'Failed to add sensor data'
      );

      setBatchId('');
      setTemperature('');
      setHumidity('');
      setLocation('');
    } catch (error) {
      console.error('Add sensor error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Dashboard role="transporter" />
      
      <div className="card">
        <h3>🚚 Transporter Portal</h3>
        <div className="note">
          Logs environmental data during transportation. Temperature and humidity are validated on-chain.
          <strong> Temperature must be between -10°C and 40°C, humidity between 0 and 40.</strong>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => setActiveTab('add')}
          >
            📊 Add Sensor Data
          </button>
          <button
            className={`tab ${activeTab === 'batches' ? 'active' : ''}`}
            onClick={() => setActiveTab('batches')}
          >
            📦 All Batches
          </button>
        </div>

        {/* Add Sensor Tab */}
        {activeTab === 'add' && (
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

            <div className="input-group">
              <label>Temperature (°C) *</label>
              <input
                type="text"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                placeholder="e.g., 5"
                disabled={loading}
              />
              <small style={{ color: '#666', fontSize: '12px' }}>
                Must be between -10°C and 40°C (contract constraint)
              </small>
            </div>

            <div className="input-group">
              <label>Humidity *</label>
              <input
                type="text"
                value={humidity}
                onChange={(e) => setHumidity(e.target.value)}
                placeholder="e.g., 30"
                disabled={loading}
              />
              <small style={{ color: '#666', fontSize: '12px' }}>
                Must be between 0 and 40 (contract constraint)
              </small>
            </div>

            <div className="input-group">
              <label>Location *</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Warehouse A, City"
                disabled={loading}
                maxLength={200}
              />
              <small style={{ color: '#666', fontSize: '12px' }}>
                Max 200 characters
              </small>
            </div>

            <button
              className="btn btn-primary"
              onClick={addSensor}
              disabled={loading || !batchId || !temperature || !humidity || !location}
            >
              {loading ? 'Adding Sensor Data...' : 'Add Sensor Data'}
            </button>
          </div>
        )}

        {/* Batches Tab */}
        {activeTab === 'batches' && (
          <div className="tab-content">
            <BatchList role="transporter" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Transporter;
