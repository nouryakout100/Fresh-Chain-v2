import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, ABI } from '../constants/contract';

/**
 * Gets a read-only contract instance (no wallet interaction required)
 */
export const getReadOnlyContract = async () => {
  if (!window.ethereum) {
    throw new Error("MetaMask (or compatible provider) is required.");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
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
