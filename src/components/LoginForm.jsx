import { useState } from 'react';
import { authenticate, getDefaultCredentials } from '../utils/auth';
import './LoginForm.css';

const LoginForm = ({ role, onLogin, onCancel }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showHint, setShowHint] = useState(false);

  const defaultCreds = getDefaultCredentials(role);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (!userId || !password) {
      setError('Please enter both ID and Password');
      return;
    }

    const isValid = authenticate(role, userId, password);
    
    if (isValid) {
      onLogin({ userId, role });
    } else {
      setError('Invalid ID or Password. Please try again.');
    }
  };

  const fillDefault = () => {
    setUserId(defaultCreds.id);
    setPassword(defaultCreds.password);
    setShowHint(false);
  };

  return (
    <div className="login-overlay">
      <div className="login-modal">
        <div className="login-header">
          <h3>🔐 Authentication Required</h3>
          <button className="login-close" onClick={onCancel}>×</button>
        </div>
        
        <div className="login-body">
          <p className="login-description">
            Please enter your credentials to access the <strong>{role.charAt(0).toUpperCase() + role.slice(1)}</strong> portal.
          </p>

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label>User ID</label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter your ID"
                autoFocus
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div className="status status-error" style={{ marginBottom: '15px' }}>
                {error}
              </div>
            )}

            <div className="login-actions">
              <button type="submit" className="btn btn-primary">
                Login
              </button>
              <button type="button" className="btn" onClick={onCancel} style={{ background: 'var(--border)', color: 'var(--text-primary)' }}>
                Cancel
              </button>
            </div>
          </form>

          <div className="login-hint">
            <button 
              type="button" 
              className="hint-button"
              onClick={() => setShowHint(!showHint)}
            >
              {showHint ? 'Hide' : 'Show'} Demo Credentials
            </button>
            
            {showHint && (
              <div className="hint-content">
                <p><strong>Demo Credentials for {role.charAt(0).toUpperCase() + role.slice(1)}:</strong></p>
                <p>ID: <code>{defaultCreds.id}</code></p>
                <p>Password: <code>{defaultCreds.password}</code></p>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={fillDefault}
                  style={{ marginTop: '10px', width: 'auto', padding: '6px 12px' }}
                >
                  Fill Credentials
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;

