# CryptoFuel dApp ⛽️
> A simple, decentralized crowdfunding dApp on Ethereum, powered by Chainlink Price Feeds.

This project allows users to fund content creators or projects using ETH. The contributed amount is validated against USD, and only the contract owner can withdraw the accumulated funds. This contract is designed with a focus on transparency, security, and gas efficiency.

---
## 🌍 Overview

-   **Language:** Solidity `^0.8.18`
-   **Frontend:** HTML, CSS, JavaScript (with Viem.js)
-   **Networks:** Sepolia, Localhost (Anvil/Hardhat)
-   **Oracle Integration:** Chainlink ETH/USD Price Feeds

---
## ✨ Key Features

- [x] **Minimum Contribution Threshold:** Ensures users contribute at least $5 worth of ETH.
- [x] **Live Chainlink Oracles:** For accurate, real-time ETH/USD price validation.
- [x] **Owner-Only Withdrawal:** Only the contract owner can withdraw funds, ensuring security.
- [x] **Modular Design:** Price conversion logic is separated into a `PriceConverter` library.
- [x] **Gas Optimized:** Utilizes `immutable` variables and custom errors to reduce transaction costs.
- [x] **Robust Access Control:** Employs modifiers and custom errors for strict permission handling.

---
## 🏗️ Project Architecture

The project's file structure is designed to separate contract logic from the user interface.

```
CryptoFuel-dApp/
├── contracts/
│   ├── FundMe.sol                # Main smart contract
│   └── PriceConverter.sol        # Helper library for price conversion
│
├── deployments/
│   └── fundme-anvil.json         # Deployment info for the local network
│
├── index.html                    # Main UI file
├── js/
│   ├── index.js                  # Frontend logic and contract interaction
│   └── constants.js              # Contract address and ABI
└── styles/
└── style.css                 # UI styles
```
---
## 🛡️ Security Considerations

-   **Access Control:** The `withdraw` function is protected by the `onlyOwner` modifier, restricting access to the contract deployer.
-   **Custom Errors:** Uses custom errors (like `FundMe__NotOwner`) instead of string-based `require` statements to save gas and provide clearer revert reasons.
-   **Checks-Effects-Interactions Pattern:** The `withdraw` function follows this pattern to prevent re-entrancy attacks by updating internal states *before* making external calls (transferring ETH).

---
## 📜 License

This project is licensed under the **MIT License**. Feel free to use, copy, or modify this project for your own decentralized applications.

---
## 🚀 Getting Started

To clone and run this project locally, follow these steps:

```bash
# 1. Clone the repository
git clone [https://github.com/emadxyz/CryptoFuel-dApp.git](https://github.com/emadxyz/CryptoFuel-dApp.git)

# 2. Navigate into the project directory
cd CryptoFuel-dApp

# 3. Deploy the smart contract
#    (Using your preferred tool like Hardhat or Foundry)
#    ex: npx hardhat deploy

# 4. Update the contract address and ABI
#    Open the deployments/ folder to get the latest deployment info
#    and copy it into the js/constants.js file.

# 5. Run the frontend
#    Open the index.html file directly in your browser.
