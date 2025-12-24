import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, ABI } from '../constants/contract';

// Cache the working provider to avoid reconnecting on every call
let cachedProvider = null;
let providerPromise = null;

/**
 * Gets a read-only contract instance (no wallet interaction required)
 * Uses MetaMask if available, otherwise uses public RPC for read-only access
 */
export const getReadOnlyContract = async () => {
  let provider;
  
  // If MetaMask is available, use it
  if (window.ethereum) {
    provider = new ethers.BrowserProvider(window.ethereum);
  } else {
    // Use cached provider if available
    if (cachedProvider) {
      provider = cachedProvider;
    } else if (providerPromise) {
      // If a connection attempt is in progress, wait for it
      provider = await providerPromise;
    } else {
      // Use public RPC provider for read-only access (no wallet needed)
      // Sepolia testnet public RPC endpoints (ordered by reliability)
      const publicRpcUrls = [
        'https://ethereum-sepolia-rpc.publicnode.com', // PublicNode (most reliable, no auth)
        'https://rpc2.sepolia.org', // Alternative Sepolia RPC
        'https://sepolia.gateway.tenderly.co', // Tenderly public RPC
        'https://rpc.sepolia.org', // Sepolia Foundation (often slow)
      ];
      
      // Try to connect to a public RPC provider
      providerPromise = (async () => {
        let connected = false;
        let lastError = null;
        
        for (const rpcUrl of publicRpcUrls) {
          try {
            const testProvider = new ethers.JsonRpcProvider(rpcUrl);
            // Test connection with shorter timeout (3 seconds)
            await Promise.race([
              testProvider.getBlockNumber(),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
            ]);
            cachedProvider = testProvider;
            connected = true;
            console.log(`✅ Connected to public RPC: ${rpcUrl}`);
            break;
          } catch (error) {
            // Silently try next endpoint (only log if all fail)
            lastError = error;
            continue;
          }
        }
        
        if (!connected) {
          const errorMessage = lastError?.message || 'Unknown error';
          throw new Error(`Unable to connect to blockchain. Please install MetaMask or check your internet connection.`);
        }
        
        return cachedProvider;
      })();
      
      provider = await providerPromise;
      providerPromise = null; // Clear promise after completion
    }
  }

  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
  return contract;
};

/**
 * Gets a contract instance with signer for transactions
 */
export const getContractWithSigner = async () => {
  if (!window.ethereum) {
    throw new Error("MetaMask (or compatible provider) is required.");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
  return { contract, signer, provider };
};

/**
 * Checks all roles for a given address
 */
export const checkRoles = async (address) => {
  try {
    const contract = await getReadOnlyContract();
    const [isProd, isTrans, isDist, isRet] = await Promise.all([
      contract.producers(address),
      contract.transporters(address),
      contract.distributors(address),
      contract.retailers(address)
    ]);

    const roles = [];
    if (isProd) roles.push("Producer");
    if (isTrans) roles.push("Transporter");
    if (isDist) roles.push("Distributor");
    if (isRet) roles.push("Retailer");

    return roles;
  } catch (error) {
    console.error("Error checking roles:", error);
    throw error;
  }
};

/**
 * Checks if an address has a specific role
 */
export const hasRole = async (address, role) => {
  try {
    const contract = await getReadOnlyContract();
    
    switch (role.toLowerCase()) {
      case 'producer':
        return await contract.producers(address);
      case 'transporter':
        return await contract.transporters(address);
      case 'distributor':
        return await contract.distributors(address);
      case 'retailer':
        return await contract.retailers(address);
      case 'admin':
        const owner = await contract.owner();
        return owner.toLowerCase() === address.toLowerCase();
      default:
        return false;
    }
  } catch (error) {
    console.error("Error checking role:", error);
    return false;
  }
};

/**
 * Formats Ethereum address for display
 */
export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Validates network connection
 */
export const validateNetwork = async (expectedChainId = null) => {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    
    if (expectedChainId && Number(network.chainId) !== expectedChainId) {
      throw new Error(`Wrong network. Expected chain ID: ${expectedChainId}, got: ${network.chainId}`);
    }
    
    return network;
  } catch (error) {
    console.error("Network validation error:", error);
    throw error;
  }
};
