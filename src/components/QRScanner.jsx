import { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import './QRScanner.css';

const QRScanner = ({ onScanSuccess, onClose }) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startScan = async () => {
    try {
      setError('');
      setScanning(true);

      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          // Success callback
          handleScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Error callback - ignore most errors
        }
      );
    } catch (err) {
      console.error('Error starting scanner:', err);
      setError('Failed to start camera. Please ensure camera permissions are granted.');
      setScanning(false);
    }
  };

  const stopScan = async () => {
    try {
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
      }
      setScanning(false);
    } catch (err) {
      console.error('Error stopping scanner:', err);
    }
  };

  const handleScanSuccess = async (decodedText) => {
    try {
      // Stop scanning
      await stopScan();
      
      // Parse the URL to extract batchId
      const url = new URL(decodedText);
      const batchId = url.searchParams.get('batchId');
      
      if (batchId) {
        onScanSuccess(batchId);
        if (onClose) onClose();
      } else {
        setError('Invalid QR code format. Please scan a valid FreshChain QR code.');
        setScanning(false);
      }
    } catch (err) {
      // If it's not a URL, try to parse as batchId directly
      if (decodedText && /^\d+$/.test(decodedText)) {
        onScanSuccess(decodedText);
        if (onClose) onClose();
      } else {
        setError('Invalid QR code. Please scan a valid FreshChain batch QR code.');
        setScanning(false);
      }
    }
  };

  return (
    <div className="qr-scanner-modal">
      <div className="qr-scanner-content">
        <div className="qr-scanner-header">
          <h3>📷 Scan QR Code</h3>
          <button className="qr-scanner-close" onClick={() => {
            stopScan();
            if (onClose) onClose();
          }}>×</button>
        </div>
        
        <div className="qr-scanner-body">
          <div id="qr-reader" style={{ width: '100%' }}></div>
          
          {!scanning && (
            <div className="qr-scanner-placeholder">
              <p>Click the button below to start scanning</p>
              <button className="btn btn-primary" onClick={startScan}>
                Start Camera Scanner
              </button>
            </div>
          )}
          
          {scanning && (
            <div className="qr-scanner-controls">
              <button className="btn btn-danger" onClick={stopScan}>
                Stop Scanning
              </button>
            </div>
          )}
          
          {error && (
            <div className="status status-error" style={{ marginTop: '15px' }}>
              {error}
            </div>
          )}
          
          <div className="qr-scanner-instructions">
            <p><strong>Instructions:</strong></p>
            <ul>
              <li>Grant camera permissions when prompted</li>
              <li>Point your camera at the QR code</li>
              <li>Keep the QR code within the frame</li>
              <li>The batch history will load automatically</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;

