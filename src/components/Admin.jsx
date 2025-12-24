import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { validateAddress } from '../utils/validation';
import { checkRoles } from '../utils/contract';
import Dashboard from './Dashboard';
import BatchList from './BatchList';

const Admin = () => {
  const { contract, isAdmin, executeTransaction, addNotification, account, refreshRoles } = useApp();
  const [adminAddr, setAdminAddr] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingRoles, setCheckingRoles] = useState(false);
  const [rolesResult, setRolesResult] = useState('');
  const [activeTab, setActiveTab] = useState('register'); // 'register', 'batches'

  const register = async (type) => {
    if (!contract) {
      addNotification('Please connect your wallet first.', 'error');
      return;
    }

    const addressValidation = validateAddress(adminAddr);
    if (!addressValidation.valid) {
      addNotification(addressValidation.error, 'error');
      return;
    }

    setLoading(true);
    setRolesResult('');

    try {
      const roleMap = {
        producer: () => contract.registerProducer(addressValidation.address),
        transporter: () => contract.registerTransporter(addressValidation.address),
        distributor: () => contract.registerDistributor(addressValidation.address),
        retailer: () => contract.registerRetailer(addressValidation.address),
      };

      await executeTransaction(
        roleMap[type],
        `${type.charAt(0).toUpperCase() + type.slice(1)} registered successfully!`,
        `Failed to register ${type}`
      );

      // If the registered address matches the connected account, refresh roles
      if (addressValidation.address.toLowerCase() === account?.toLowerCase()) {
        // Small delay to ensure blockchain state is updated
        setTimeout(() => {
          refreshRoles();
          addNotification('Your role has been updated!', 'success');
        }, 1000);
      }

      setAdminAddr('');
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkRolesFromAdmin = async () => {
    const addressValidation = validateAddress(adminAddr);
    if (!addressValidation.valid) {
      setRolesResult(addressValidation.error);
      return;
    }

    setCheckingRoles(true);
    setRolesResult('');

    try {
      const roles = await checkRoles(addressValidation.address);
      
      if (roles.length === 0) {
        setRolesResult(`Address ${addressValidation.address} has no registered roles.`);
      } else {
        setRolesResult(`Registered roles for ${addressValidation.address}:\n - ${roles.join('\n - ')}`);
      }
    } catch (error) {
      console.error('Error checking roles:', error);
      setRolesResult(`Error: ${error.message || 'Failed to check roles. Please check network connection.'}`);
    } finally {
      setCheckingRoles(false);
    }
  };

  return (
    <div>
      <Dashboard role="admin" />
      
      <div className="card">
        <h3>👑 Admin Portal</h3>
        <div className="note">
          Registers actors in the supply chain. Only the contract owner can perform these actions.
          After connecting your wallet, you can also verify any address's roles.
        </div>

        {isAdmin ? (
          <div className="status status-success">
            ✅ You are the contract owner (Admin). You can perform admin actions.
          </div>
        ) : (
          <div className="status status-error">
            ⚠️ You are NOT the contract owner. Admin actions will revert on-chain.
          </div>
        )}

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => setActiveTab('register')}
          >
            👥 Register Actors
          </button>
          <button
            className={`tab ${activeTab === 'batches' ? 'active' : ''}`}
            onClick={() => setActiveTab('batches')}
          >
            📦 All Batches
          </button>
        </div>

        {/* Register Tab */}
        {activeTab === 'register' && (
          <div className="tab-content">
            <div className="input-group">
              <label>Actor Ethereum Address</label>
              <input
                type="text"
                value={adminAddr}
                onChange={(e) => setAdminAddr(e.target.value)}
                placeholder="0x..."
                disabled={loading || checkingRoles}
              />
            </div>

            <div className="button-grid">
              <button
                className="btn btn-primary"
                onClick={() => register('producer')}
                disabled={loading || !isAdmin || checkingRoles}
              >
                {loading ? 'Registering...' : 'Register Producer'}
              </button>

              <button
                className="btn btn-primary"
                onClick={() => register('transporter')}
                disabled={loading || !isAdmin || checkingRoles}
              >
                {loading ? 'Registering...' : 'Register Transporter'}
              </button>

              <button
                className="btn btn-primary"
                onClick={() => register('distributor')}
                disabled={loading || !isAdmin || checkingRoles}
              >
                {loading ? 'Registering...' : 'Register Distributor'}
              </button>

              <button
                className="btn btn-primary"
                onClick={() => register('retailer')}
                disabled={loading || !isAdmin || checkingRoles}
              >
                {loading ? 'Registering...' : 'Register Retailer'}
              </button>
            </div>

            <button
              className="btn btn-primary"
              onClick={checkRolesFromAdmin}
              disabled={loading || checkingRoles}
              style={{ marginTop: '10px' }}
            >
              {checkingRoles ? 'Checking...' : 'Check Roles for Address'}
            </button>

            {rolesResult && (
              <pre className="pre-formatted" style={{ marginTop: '15px' }}>
                {rolesResult}
              </pre>
            )}
          </div>
        )}

        {/* Batches Tab */}
        {activeTab === 'batches' && (
          <div className="tab-content">
            <BatchList role="admin" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
