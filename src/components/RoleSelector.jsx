import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { hasRole } from '../utils/contract';
import './RoleSelector.css';

const RoleSelector = ({ selectedRole, onRoleChange }) => {
  const { account, isAdmin, refreshRolesCounter } = useApp();
  const [roleStatus, setRoleStatus] = useState({});
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (account) {
      checkAllRoles();
    }
  }, [account, isAdmin, refreshRolesCounter]);

  const checkAllRoles = async () => {
    if (!account) return;
    
    setChecking(true);
    try {
      const roles = ['admin', 'producer', 'transporter', 'distributor', 'retailer'];
      const status = {};
      
      for (const role of roles) {
        if (role === 'admin') {
          status[role] = isAdmin;
        } else {
          status[role] = await hasRole(account, role);
        }
      }
      
      setRoleStatus(status);
    } catch (error) {
      console.error('Error checking roles:', error);
    } finally {
      setChecking(false);
    }
  };

  const roles = [
    { value: 'admin', label: '👑 Admin', description: 'Register actors' },
    { value: 'producer', label: '🌱 Producer', description: 'Create batches' },
    { value: 'transporter', label: '🚚 Transporter', description: 'Log sensor data' },
    { value: 'distributor', label: '🏭 Distributor', description: 'Transfer ownership' },
    { value: 'retailer', label: '🏪 Retailer', description: 'Final inspection' },
    { value: 'customer', label: '👤 Customer', description: 'View history' },
  ];

  return (
    <div className="card">
      <h3>Select Your Role</h3>
      <div className="input-group">
        <select 
          value={selectedRole} 
          onChange={(e) => onRoleChange(e.target.value)}
          style={{ fontSize: '16px', padding: '12px' }}
        >
          <option value="">-- Select Role --</option>
          {roles.map(role => {
            // Check if user is registered for this role
            const isRegistered = role.value === 'admin' 
              ? isAdmin 
              : role.value === 'customer'
              ? true // Customer is always accessible
              : roleStatus[role.value];
            
            // Role is locked if: not customer, account exists, checking is done, and user is NOT registered
            const isLocked = role.value !== 'customer' && 
                           account && 
                           !checking && 
                           !isRegistered;
            
            return (
              <option 
                key={role.value} 
                value={role.value}
                disabled={isLocked}
              >
                {role.label} - {role.description}
                {isLocked && ' 🔒 (You don\'t have access)'}
                {!isLocked && role.value !== 'customer' && account && isRegistered && ' ✅'}
              </option>
            );
          })}
        </select>
      </div>
      
      {checking && account && (
        <p style={{ marginTop: '10px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Checking role assignments...
        </p>
      )}
      
      {!checking && account && (
        <div className="role-status-section">
          <div className="role-status-info">
            {isAdmin && (
              <span key="admin" className="role-badge role-badge-admin">
                👑 Admin
              </span>
            )}
            {Object.entries(roleStatus).map(([role, hasAccess]) => (
              hasAccess && role !== 'admin' && (
                <span key={role} className="role-badge">
                  {role === 'producer' && '🌱 '}
                  {role === 'transporter' && '🚚 '}
                  {role === 'distributor' && '🏭 '}
                  {role === 'retailer' && '🏪 '}
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </span>
              )
            ))}
          </div>
          
          {Object.values(roleStatus).every(v => !v) && !isAdmin && (
            <p className="role-status-empty">
              No roles assigned. Contact admin to register your address.
            </p>
          )}
          
          <button
            className="btn-refresh-roles"
            onClick={checkAllRoles}
            disabled={checking}
          >
            {checking ? 'Refreshing...' : '🔄 Refresh Roles'}
          </button>
        </div>
      )}
    </div>
  );
};

export default RoleSelector;
