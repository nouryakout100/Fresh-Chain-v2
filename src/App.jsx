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

      setRoleAuthorized(authorized);

      if (!authorized) {
        addNotification(
          `You are not registered as a ${selectedRole}. Please contact admin to register your address.`,
          'error'
        );
        setSelectedRole('');
        setAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking role authorization:', error);
      setRoleAuthorized(false);
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

    // Check if user has the role
    try {
      let hasAccess = false;
      
      if (role === 'admin') {
        hasAccess = isAdmin;
      } else {
        hasAccess = await hasRole(account, role);
      }

      if (hasAccess) {
        // User has the role, show login form
        setPendingRole(role);
        setShowLogin(true);
      } else {
        // User doesn't have the role
        addNotification(
          `You are not registered as a ${role}. Please contact admin to register your address.`,
          'error'
        );
      }
    } catch (error) {
      console.error('Error checking role:', error);
      addNotification('Failed to check role registration. Please try again.', 'error');
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

        {account && selectedRole === 'admin' && authenticated && roleAuthorized && (
          <Admin />
        )}

        {account && selectedRole === 'producer' && authenticated && roleAuthorized && (
          <Producer />
        )}

        {account && selectedRole === 'transporter' && authenticated && roleAuthorized && (
          <Transporter />
        )}

        {account && selectedRole === 'distributor' && authenticated && roleAuthorized && (
          <Distributor />
        )}

        {account && selectedRole === 'retailer' && authenticated && roleAuthorized && (
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
