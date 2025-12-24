import { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import WalletConnect from './components/WalletConnect';
import RoleSelector from './components/RoleSelector';
import Admin from './components/Admin';
import Producer from './components/Producer';
import Transporter from './components/Transporter';
import Distributor from './components/Distributor';
import Retailer from './components/Retailer';
import Customer from './components/Customer';
import LoginForm from './components/LoginForm';
import NotificationContainer from './components/NotificationContainer';
import { hasRole } from './utils/contract';
import './App.css';

const AppContent = () => {
  const { account, isAdmin, addNotification } = useApp();
  const [selectedRole, setSelectedRole] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [pendingRole, setPendingRole] = useState('');
  const [roleAuthorized, setRoleAuthorized] = useState(false);

  useEffect(() => {
    // Check for batchId in URL params (from QR code)
    const params = new URLSearchParams(window.location.search);
    const batchId = params.get('batchId');
    if (batchId) {
      setSelectedRole('customer');
      setAuthenticated(true);
      setRoleAuthorized(true);
    }
  }, []);

  useEffect(() => {
    // Check role authorization when role or account changes
    if (account && selectedRole && selectedRole !== 'customer') {
      checkRoleAuthorization();
    } else if (selectedRole === 'customer') {
      setRoleAuthorized(true);
      setAuthenticated(true);
    }
  }, [account, selectedRole, isAdmin]);

  const checkRoleAuthorization = async () => {
    if (!account || !selectedRole) return;

    try {
      let authorized = false;
      
      if (selectedRole === 'admin') {
        authorized = isAdmin;
      } else {
        authorized = await hasRole(account, selectedRole);
      }

      // For demonstration: Allow viewing interface even if not registered
      // Set to true to allow interface access, but actual operations will still check on-chain
      setRoleAuthorized(true);
      
      // Don't show error or block access - allow viewing for demonstration
    } catch (error) {
      console.error('Error checking role authorization:', error);
      // Still allow access for demonstration
      setRoleAuthorized(true);
    }
  };

  const handleRoleChange = async (role) => {
    // Customer doesn't need authentication or registration
    if (role === 'customer') {
      setSelectedRole(role);
      setAuthenticated(true);
      setRoleAuthorized(true);
      return;
    }

    // Clear previous state
    setSelectedRole('');
    setAuthenticated(false);
    setRoleAuthorized(false);

    if (!role) {
      return;
    }

    if (!account) {
      addNotification('Please connect your wallet first.', 'error');
      return;
    }

    // For demonstration: Allow access to all roles to view interfaces
    // Check if user has the role, but allow access anyway
    try {
      let hasAccess = false;
      
      if (role === 'admin') {
        hasAccess = isAdmin;
      } else {
        hasAccess = await hasRole(account, role);
      }

      // For demonstration: Always show login form but allow access
      // Show login form regardless of registration status
      setPendingRole(role);
      setShowLogin(true);
      
      // Note: Actual blockchain operations will still fail if not registered
      // But the interface will be visible after login for demonstration
    } catch (error) {
      console.error('Error checking role:', error);
      // Still allow access for demonstration - show login form
      setPendingRole(role);
      setShowLogin(true);
    }
  };

  const handleLogin = (loginData) => {
    setAuthenticated(true);
    setSelectedRole(pendingRole);
    setRoleAuthorized(true);
    setShowLogin(false);
    setPendingRole('');
  };

  const handleCancelLogin = () => {
    setShowLogin(false);
    setPendingRole('');
    setSelectedRole('');
    setAuthenticated(false);
    setRoleAuthorized(false);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🥬 FreshChain – Blockchain Supply Chain</h1>
        <p className="subtitle">Transparent, Traceable, Trustworthy</p>
      </header>

      <main className="app-main">
        <NotificationContainer />
        
        <WalletConnect />

        {account && (
          <RoleSelector 
            selectedRole={selectedRole}
            onRoleChange={handleRoleChange}
          />
        )}

        {showLogin && pendingRole && (
          <LoginForm
            role={pendingRole}
            onLogin={handleLogin}
            onCancel={handleCancelLogin}
          />
        )}

        {account && selectedRole === 'admin' && authenticated && (
          <Admin />
        )}

        {account && selectedRole === 'producer' && authenticated && (
          <Producer />
        )}

        {account && selectedRole === 'transporter' && authenticated && (
          <Transporter />
        )}

        {account && selectedRole === 'distributor' && authenticated && (
          <Distributor />
        )}

        {account && selectedRole === 'retailer' && authenticated && (
          <Retailer />
        )}

        {selectedRole === 'customer' && authenticated && (
          <Customer />
        )}
      </main>
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
