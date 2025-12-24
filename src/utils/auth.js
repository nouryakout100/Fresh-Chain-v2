// Hardcoded credentials for demonstration
// In production, these would be stored securely and verified against a backend

const HARDCODED_CREDENTIALS = {
  admin: [
    { id: 'admin1', password: 'admin123' },
  ],
  producer: [
    { id: 'producer1', password: 'producer123' },
  ],
  transporter: [
    { id: 'transporter1', password: 'transporter123' },
  ],
  distributor: [
    { id: 'distributor1', password: 'distributor123' },
  ],
  retailer: [
    { id: 'retailer1', password: 'retailer123' },
  ],
  customer: [
    { id: 'customer1', password: 'customer123' },
  ],
};

export const authenticate = (role, userId, password) => {
  const credentials = HARDCODED_CREDENTIALS[role] || [];
  
  return credentials.some(
    cred => cred.id === userId && cred.password === password
  );
};

export const getDefaultCredentials = (role) => {
  const credentials = HARDCODED_CREDENTIALS[role];
  if (credentials && credentials.length > 0) {
    return {
      id: credentials[0].id,
      password: credentials[0].password,
    };
  }
  return { id: '', password: '' };
};

