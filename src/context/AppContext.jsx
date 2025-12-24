import { createContext, useContext, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, ABI } from '../constants/contract';

const AppContext = createContext(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [contract, setContract] = useState(null);
  const [signer, setSigner] = useState(null);
  const [provider, setProvider] = useState(null);
  const [network, setNetwork] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [refreshRolesCounter, setRefreshRolesCounter] = useState(0);

  const addNotification = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    const notification = { id, message, type };
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
    
    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const refreshRoles = useCallback(() => {
    setRefreshRolesCounter(prev => prev + 1);
  }, []);

  const checkNetwork = useCallback(async () => {
    if (!window.ethereum) return null;
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      return {
        chainId: Number(network.chainId),
        name: network.name,
      };
    } catch (error) {
      console.error('Error checking network:', error);
      return null;
    }
  }, []);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      addNotification('Please install MetaMask to use this application.', 'error');
      throw new Error('MetaMask not installed');
    }

    setIsConnecting(true);
    
    try {
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      // Check network
      const networkInfo = await checkNetwork();
      setNetwork(networkInfo);
      
      // Create contract instance
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      
      // Check if user is admin
      const readOnlyContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
      const ownerAddr = await readOnlyContract.owner();
      const adminStatus = ownerAddr.toLowerCase() === address.toLowerCase();
      
      setAccount(address);
      setContract(contract);
      setSigner(signer);
      setProvider(provider);
      setIsAdmin(adminStatus);
      
      addNotification('Wallet connected successfully!', 'success');
      
      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          connectWallet();
        }
      });
      
      // Listen for network changes
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
      
      return { address, contract, signer, provider, isAdmin: adminStatus };
    } catch (error) {
      console.error('Error connecting wallet:', error);
      const message = error.code === 4001 
        ? 'Please connect your MetaMask wallet.'
        : error.message || 'Failed to connect wallet. Please try again.';
      addNotification(message, 'error');
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [checkNetwork, addNotification]);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setContract(null);
    setSigner(null);
    setProvider(null);
    setIsAdmin(false);
    setNetwork(null);
    addNotification('Wallet disconnected', 'info');
  }, [addNotification]);

  const executeTransaction = useCallback(async (txFunction, successMessage, errorMessage) => {
    if (!contract || !signer) {
      throw new Error('Wallet not connected');
    }

    try {
      const tx = await txFunction();
      addNotification('Transaction submitted. Waiting for confirmation...', 'info');
      
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        addNotification(successMessage || 'Transaction confirmed!', 'success');
        return receipt;
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      console.error('Transaction error:', error);
      
      let message = errorMessage || 'Transaction failed';
      
      if (error.reason) {
        message = error.reason;
      } else if (error.data?.message) {
        message = error.data.message;
      } else if (error.message) {
        // Parse common error messages
        if (error.message.includes('user rejected')) {
          message = 'Transaction was rejected by user';
        } else if (error.message.includes('insufficient funds')) {
          message = 'Insufficient funds for transaction';
        } else if (error.message.includes('revert')) {
          message = error.message.match(/revert\s+(.+)/)?.[1] || 'Transaction reverted';
        } else {
          message = error.message;
        }
      }
      
      addNotification(message, 'error');
      throw error;
    }
  }, [contract, signer, addNotification]);

  const value = {
    account,
    isAdmin,
    contract,
    signer,
    provider,
    network,
    isConnecting,
    notifications,
    refreshRolesCounter,
    connectWallet,
    disconnectWallet,
    executeTransaction,
    addNotification,
    removeNotification,
    checkNetwork,
    refreshRoles,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

