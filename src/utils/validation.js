import { ethers } from 'ethers';

/**
 * Validates Ethereum address
 */
export const validateAddress = (address) => {
  if (!address || typeof address !== 'string') {
    return { valid: false, error: 'Address is required' };
  }
  
  const trimmed = address.trim();
  
  if (!ethers.isAddress(trimmed)) {
    return { valid: false, error: 'Invalid Ethereum address format' };
  }
  
  return { valid: true, address: trimmed };
};

/**
 * Validates batch ID (must be a positive integer)
 */
export const validateBatchId = (batchId) => {
  if (!batchId || typeof batchId !== 'string') {
    return { valid: false, error: 'Batch ID is required' };
  }
  
  const trimmed = batchId.trim();
  
  if (trimmed === '') {
    return { valid: false, error: 'Batch ID cannot be empty' };
  }
  
  // Check if it's a valid number
  if (!/^\d+$/.test(trimmed)) {
    return { valid: false, error: 'Batch ID must be a positive integer' };
  }
  
  // Check for overflow (JavaScript safe integer range)
  const num = Number(trimmed);
  if (!Number.isSafeInteger(num) || num <= 0) {
    return { valid: false, error: 'Batch ID must be a positive integer within safe range' };
  }
  
  return { valid: true, batchId: trimmed, batchIdBigInt: BigInt(trimmed) };
};

/**
 * Validates product name
 */
export const validateProductName = (productName) => {
  if (!productName || typeof productName !== 'string') {
    return { valid: false, error: 'Product name is required' };
  }
  
  const trimmed = productName.trim();
  
  if (trimmed === '') {
    return { valid: false, error: 'Product name cannot be empty' };
  }
  
  if (trimmed.length > 100) {
    return { valid: false, error: 'Product name must be 100 characters or less' };
  }
  
  return { valid: true, productName: trimmed };
};

/**
 * Validates quantity (must be a positive integer)
 */
export const validateQuantity = (quantity) => {
  if (!quantity || typeof quantity !== 'string') {
    return { valid: false, error: 'Quantity is required' };
  }
  
  const trimmed = quantity.trim();
  
  if (trimmed === '') {
    return { valid: false, error: 'Quantity cannot be empty' };
  }
  
  if (!/^\d+$/.test(trimmed)) {
    return { valid: false, error: 'Quantity must be a positive integer' };
  }
  
  const num = Number(trimmed);
  if (!Number.isSafeInteger(num) || num <= 0) {
    return { valid: false, error: 'Quantity must be a positive integer within safe range' };
  }
  
  return { valid: true, quantity: trimmed, quantityBigInt: BigInt(trimmed) };
};

/**
 * Validates temperature according to contract constraints (-10 to 40)
 */
export const validateTemperature = (temperature) => {
  if (temperature === '' || temperature === null || temperature === undefined) {
    return { valid: false, error: 'Temperature is required' };
  }
  
  const trimmed = String(temperature).trim();
  
  if (trimmed === '') {
    return { valid: false, error: 'Temperature cannot be empty' };
  }
  
  // Allow negative numbers
  if (!/^-?\d+$/.test(trimmed)) {
    return { valid: false, error: 'Temperature must be an integer' };
  }
  
  const num = Number(trimmed);
  
  if (!Number.isInteger(num)) {
    return { valid: false, error: 'Temperature must be an integer' };
  }
  
  // Contract constraint: temperature >= -10 && temperature <= 40
  if (num < -10 || num > 40) {
    return { valid: false, error: 'Temperature must be between -10°C and 40°C' };
  }
  
  return { valid: true, temperature: trimmed, temperatureBigInt: BigInt(num) };
};

/**
 * Validates humidity according to contract constraints (0 to 40)
 */
export const validateHumidity = (humidity) => {
  if (humidity === '' || humidity === null || humidity === undefined) {
    return { valid: false, error: 'Humidity is required' };
  }
  
  const trimmed = String(humidity).trim();
  
  if (trimmed === '') {
    return { valid: false, error: 'Humidity cannot be empty' };
  }
  
  if (!/^\d+$/.test(trimmed)) {
    return { valid: false, error: 'Humidity must be a non-negative integer' };
  }
  
  const num = Number(trimmed);
  
  if (!Number.isInteger(num) || num < 0) {
    return { valid: false, error: 'Humidity must be a non-negative integer' };
  }
  
  // Contract constraint: humidity >= 0 && humidity <= 40
  if (num > 40) {
    return { valid: false, error: 'Humidity must be between 0 and 40' };
  }
  
  return { valid: true, humidity: trimmed, humidityBigInt: BigInt(num) };
};

/**
 * Validates location string
 */
export const validateLocation = (location) => {
  if (!location || typeof location !== 'string') {
    return { valid: false, error: 'Location is required' };
  }
  
  const trimmed = location.trim();
  
  if (trimmed === '') {
    return { valid: false, error: 'Location cannot be empty' };
  }
  
  if (trimmed.length > 200) {
    return { valid: false, error: 'Location must be 200 characters or less' };
  }
  
  return { valid: true, location: trimmed };
};

/**
 * Validates that batch doesn't exist (for createBatch)
 */
export const validateBatchDoesNotExist = async (contract, batchId) => {
  try {
    const batch = await contract.batches(batchId);
    // Contract checks: batches[batchId].batchId == 0 means batch doesn't exist
    if (batch.batchId.toString() !== '0') {
      return { valid: false, error: `Batch ID ${batchId} already exists` };
    }
    return { valid: true };
  } catch (error) {
    console.error('Error checking batch existence:', error);
    return { valid: false, error: 'Failed to verify batch ID availability' };
  }
};

/**
 * Checks all roles for a given address
 * Re-exported from contract utils for convenience
 */
export const checkRoles = async (address) => {
  const { checkRoles: checkRolesUtil } = await import('./contract');
  return checkRolesUtil(address);
};

/**
 * Validates that user is the current owner (for transferOwnership)
 */
export const validateOwnership = async (contract, batchId, userAddress) => {
  try {
    const batch = await contract.batches(batchId);
    
    // Check if batch exists
    if (batch.batchId.toString() === '0') {
      return { valid: false, error: 'Batch does not exist' };
    }
    
    // Check ownership
    if (batch.currentOwner.toLowerCase() !== userAddress.toLowerCase()) {
      return { 
        valid: false, 
        error: `You are not the owner of this batch. Current owner: ${batch.currentOwner}` 
      };
    }
    
    return { valid: true, batch };
  } catch (error) {
    console.error('Error validating ownership:', error);
    return { valid: false, error: 'Failed to verify ownership' };
  }
};

/**
 * Sanitizes string input to prevent injection
 */
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>]/g, '');
};

