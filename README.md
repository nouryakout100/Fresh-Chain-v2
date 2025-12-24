# 🥬 FreshChain - Blockchain Supply Chain Management

A modern React.js application for managing blockchain-based supply chain operations. This application allows different actors (Admin, Producer, Transporter, Distributor, Retailer, and Customer) to interact with a smart contract to track products through the supply chain.

## ✨ Features

- **Modern React Architecture**: Built with React 18, Vite, and modern hooks
- **Role-Based Access**: Different interfaces for each supply chain role
- **Wallet Integration**: MetaMask integration for blockchain transactions
- **QR Code Generation**: Generate QR codes for batch tracking
- **Batch History**: View complete product history including ownership and sensor data
- **Responsive Design**: Beautiful, modern UI that works on all devices
- **GitHub Pages Ready**: Configured for easy deployment

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MetaMask browser extension
- Access to the blockchain network where the contract is deployed

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd project
```

2. Install dependencies:
```bash
npm install
```

3. Update configuration:
   - Open `vite.config.js` and update the `base` path with your GitHub repository name
   - Open `package.json` and update the `homepage` field with your GitHub Pages URL

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 📦 Building for Production

To build the application for production:

```bash
npm run build
```

The built files will be in the `dist` directory.

## 🌐 Deploying to GitHub Pages

### Step 1: Update Configuration

Before deploying, update these files:

1. **vite.config.js**: Update the `base` field with your repository name:
```javascript
base: '/YOUR_REPO_NAME/',
```

2. **package.json**: Update the `homepage` field:
```json
"homepage": "https://YOUR_USERNAME.github.io/YOUR_REPO_NAME"
```

### Step 2: Deploy

1. Make sure you've built the project:
```bash
npm run build
```

2. Deploy to GitHub Pages:
```bash
npm run deploy
```

This will:
- Build the project
- Deploy the `dist` folder to the `gh-pages` branch
- Make your site available at `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME`

### Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under **Source**, select the `gh-pages` branch
4. Select the `/ (root)` folder
5. Click **Save**

Your site should be live in a few minutes!

## 🏗️ Project Structure

```
project/
├── src/
│   ├── components/          # React components
│   │   ├── Admin.jsx
│   │   ├── Customer.jsx
│   │   ├── Distributor.jsx
│   │   ├── Producer.jsx
│   │   ├── Retailer.jsx
│   │   ├── RoleSelector.jsx
│   │   ├── Transporter.jsx
│   │   └── WalletConnect.jsx
│   ├── constants/           # Contract constants
│   │   └── contract.js      # Contract address and ABI
│   ├── utils/               # Utility functions
│   │   └── contract.js      # Contract interaction helpers
│   ├── App.jsx              # Main app component
│   ├── App.css              # App styles
│   ├── index.css            # Global styles
│   └── main.jsx             # Entry point
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## 🔧 Configuration

### Contract Address

The contract address is defined in `src/constants/contract.js`. Update it if you're using a different contract:

```javascript
export const CONTRACT_ADDRESS = "0x0F7A6dE8d6D2D0d683225Da4a8EDF94b1dcE6360";
```

### Network

Make sure MetaMask is connected to the correct network where your contract is deployed.

## 👥 Roles

### 👑 Admin
- Register new actors (Producers, Transporters, Distributors, Retailers)
- Verify actor roles
- Only the contract owner can perform admin actions

### 🌱 Producer
- Create new product batches
- Generate QR codes for batch tracking
- Becomes the initial owner of created batches

### 🚚 Transporter
- Log environmental sensor data (temperature, humidity, location)
- Data is validated on-chain (temperature: -10°C to 40°C, humidity: 0 to 40)

### 🏭 Distributor
- Transfer batch ownership to the next actor in the chain
- Only the current owner can transfer ownership

### 🏪 Retailer
- Perform final inspection
- Mark batches as arrived
- Record inspection results (passed/failed)

### 👤 Customer
- View complete batch history (no transaction required)
- Verify actor roles
- Generate QR codes for sharing
- Auto-loads batch data from QR code URLs

## 🛠️ Technologies Used

- **React 18**: Modern React with hooks
- **Vite**: Fast build tool and dev server
- **Ethers.js v6**: Ethereum library for blockchain interactions
- **qrcode.react**: QR code generation
- **CSS3**: Modern styling with gradients and animations

## 📝 Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run deploy`: Build and deploy to GitHub Pages

## 🔒 Security Notes

- Always verify contract addresses before use
- Never share your private keys
- Be cautious when approving transactions
- Verify all actor addresses before registration

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built for blockchain supply chain management
- Uses the FreshChain smart contract
