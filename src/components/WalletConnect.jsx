import { useApp } from '../context/AppContext';
import { formatAddress } from '../utils/contract';
import './WalletConnect.css';

const WalletConnect = () => {
  const { account, isConnecting, network, connectWallet, disconnectWallet } = useApp();

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (error) {
      // Error is handled in context
      console.error('Connection error:', error);
    }
  };

  if (account) {
    return (
      <div className="card">
        <div className="status status-success">
          <div className="wallet-connect-info">
            <div className="wallet-connect-details">
              <strong>✅ Connected:</strong> {formatAddress(account)}
              <br />
              <small className="wallet-address-full">
                {account}
              </small>
              {network && (
                <div className="wallet-network-info">
                  Network: {network.name} (Chain ID: {network.chainId})
                </div>
              )}
            </div>
            <button 
              className="btn btn-primary wallet-disconnect-btn" 
              onClick={disconnectWallet}
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <button 
        className="btn btn-primary" 
        onClick={handleConnect}
        disabled={isConnecting}
      >
        {isConnecting ? 'Connecting...' : '🔗 Connect MetaMask'}
      </button>
      {!window.ethereum && (
        <div className="status status-error" style={{ marginTop: '15px' }}>
          ⚠️ MetaMask is not installed. Please install MetaMask to use this application.
        </div>
      )}
    </div>
  );
};

export default WalletConnect;
