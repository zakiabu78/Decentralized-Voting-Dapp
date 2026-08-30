# 🗳️ Decentralized Voting DApp

A decentralized voting application (DApp) built with **Next.js, Ethereum, Solidity, and IPFS**.

The application supports two modes:

* **Local mode** — runs on a local Hardhat blockchain. Fast, free, and ideal for development and testing.
* **Sepolia mode** — runs on Ethereum's public Sepolia testnet. Transactions are publicly verifiable and shareable through Etherscan.

## 🛠️ Technology Stack

| Layer                  | Technology                                          |
| ---------------------- | --------------------------------------------------- |
| Frontend               | Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 |
| Smart Contract         | Solidity 0.8.28 · OpenZeppelin 5                    |
| Local Blockchain       | Hardhat · Chain ID `31337`                          |
| Public Blockchain      | Ethereum Sepolia · Chain ID `11155111`              |
| Blockchain Integration | ethers.js v6                                        |
| Wallet                 | MetaMask                                            |
| Decentralized Storage  | IPFS via Pinata                                     |
| Sepolia RPC            | Alchemy                                             |

---

# 📋 Prerequisites

Before running the project, install:

### 1. Node.js

Node.js **20 or higher** is required. The project was tested with Node.js 22.

Check your installation:

```bash
node -v
npm -v
```

You can download Node.js from:

https://nodejs.org

### 2. MetaMask

Install the MetaMask browser extension:

https://metamask.io

### 3. Code Editor

VS Code is recommended, but any code editor can be used.

### 4. Pinata

A free Pinata account is required for IPFS image uploads:

https://www.pinata.cloud

### 5. Sepolia Mode Only

If you want to deploy to Sepolia, you will also need:

* An Alchemy account for the Sepolia RPC
* A dedicated Sepolia wallet
* Sepolia test ETH
* An Etherscan API key if you want to verify the contract

---

# ⚠️ Important Before Running

## 1. Compile the Smart Contract First

The frontend uses the generated Hardhat artifact:

```text
artifacts/contracts/voting_contracts.sol/VotingSystem.json
```

This file does not exist until the contract has been compiled.

Run:

```bash
npx hardhat compile
```

before starting the frontend.

---

## 2. Contract Address

The frontend stores the deployed contract address in:

```text
context/Constants.tsx
```

For example:

```ts
export const votingAddress = "0x...";
```

This address must correspond to the contract deployment for the network you are currently using.

### Local network

With a fresh Hardhat node, the first deployment normally produces:

```text
0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### Sepolia

The deployment script generates a different address. Copy the address printed by:

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

and update `votingAddress`.

> **Important:** Every time you deploy a new contract, update the address in `Constants.tsx`.

---

## 3. Use Webpack for Next.js

This project uses `ipfs-http-client`, which requires Node.js modules such as `fs`, `net`, and `tls`.

Next.js 16 uses Turbopack by default, so start the development server with Webpack:

```bash
npx next dev --webpack --port 3005
```

---

## 4. Use `localhost`

When testing locally, open:

```text
http://localhost:3005
```

Do not use a LAN IP such as:

```text
http://192.168.x.x:3005
```

MetaMask's injected provider works reliably with `localhost`.

---

# 🔐 Environment Variables

Create a file named:

```text
.env.local
```

in the project root.

**Never commit `.env.local` to GitHub.**

The repository includes `.env.example` as a template.

## Local Mode

For local development, the main variable required by the frontend is:

```env
NEXT_PUBLIC_PINATA_JWT=<your_pinata_jwt>
```

## Sepolia Mode

For Sepolia deployment, configure:

```env
# IPFS image storage
NEXT_PUBLIC_PINATA_JWT=<your_pinata_jwt>

# Sepolia RPC used by Hardhat
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/<YOUR_ALCHEMY_KEY>

# Dedicated Sepolia deployment wallet
DEPLOYER_PRIVATE_KEY=0x<your_sepolia_private_key>

# Etherscan verification
ETHERSCAN_API_KEY=<your_etherscan_api_key>

# Sepolia RPC used by the browser
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/<YOUR_ALCHEMY_KEY>

# WebSocket RPC used for the live feed
NEXT_PUBLIC_RPC_WSS_URL=wss://eth-sepolia.g.alchemy.com/v2/<YOUR_ALCHEMY_KEY>
```

### Security

* Never commit `.env.local`.
* Never publish a private key.
* Use a dedicated wallet for Sepolia development.
* Never use a wallet containing real funds as your deployment wallet.
* If a private key, API key, JWT, or other credential is exposed, revoke or regenerate it immediately.
* Variables beginning with `NEXT_PUBLIC_` are intentionally exposed to the browser. **Never put private keys or other sensitive secrets in `NEXT_PUBLIC_` variables.**

---

# 🟢 Mode A — Local Development

The local mode uses a Hardhat blockchain running on your machine.

It is:

* Fast
* Free
* Deterministic
* Suitable for development and testing

You will normally use **three terminals**.

---

## Step 1 — Install Dependencies

From the project directory:

```bash
npm install
```

---

## Step 2 — Compile the Contract

In Terminal 1:

```bash
npx hardhat compile
```

This generates:

```text
artifacts/
```

The generated artifacts contain the contract ABI and bytecode.

---

## Step 3 — Start the Hardhat Node

In Terminal 1:

```bash
npx hardhat node
```

The node runs at:

```text
http://127.0.0.1:8545
```

with:

```text
Chain ID: 31337
```

Hardhat provides test accounts funded with fake ETH.

### Default Hardhat Account

Hardhat's first account is commonly:

```text
Address:
0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

Its default private key is publicly known and intended only for local development.

> ⚠️ **Never use Hardhat's default private key on Sepolia or mainnet.**

Keep this terminal running while using the local blockchain.

Restarting the Hardhat node resets the local blockchain state.

---

## Step 4 — Deploy the Contract

In Terminal 2:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

The deployment script prints the deployed contract address.

With a fresh Hardhat node, the first deployment is normally:

```text
0x5FbDB2315678afecb367f032d93F642f64180aa3
```

If a different address is printed, update:

```text
context/Constants.tsx
```

with the new address.

The deploying account becomes the organizer and receives:

* `DEFAULT_ADMIN_ROLE`
* `ORGANIZER_ROLE`

The voting period initially lasts **90 minutes** from deployment.

---

## Step 5 — Configure the Frontend for Local Mode

In:

```text
context/Voter.tsx
```

use the local provider:

```ts
const provider = new ethers.JsonRpcProvider(
  "http://127.0.0.1:8545"
);
```

---

## Step 6 — Start the Frontend

In Terminal 3:

```bash
npx next dev --webpack --port 3005
```

Open:

```text
http://localhost:3005
```

---

## Step 7 — Configure MetaMask

### Add the Hardhat Network

In MetaMask, add a custom network:

```text
Network Name: Hardhat Local
RPC URL: http://127.0.0.1:8545
Chain ID: 31337
Currency Symbol: ETH
```

### Import the Organizer Account

Import Hardhat account #0 using the private key printed by:

```bash
npx hardhat node
```

You can import additional Hardhat accounts to simulate voters.

Then connect MetaMask to the application.

---

# 🔵 Mode B — Sepolia Testnet

Sepolia is Ethereum's public test network.

It provides:

* Public transactions
* Real blockchain confirmations
* Shareable Etherscan links
* Free test ETH

You **do not** need to run:

```bash
npx hardhat node
```

---

## Step 1 — Create a Dedicated Sepolia Wallet

Create a new MetaMask account specifically for development.

For example:

```text
Sepolia Dev
```

Export its private key and store it **only in `.env.local`**:

```env
DEPLOYER_PRIVATE_KEY=0x...
```

> ⚠️ Never use a wallet containing real funds.

---

## Step 2 — Get Sepolia Test ETH

You need Sepolia ETH to pay deployment gas.

Use a Sepolia faucet such as the Google Cloud faucet:

https://cloud.google.com/application/web3/faucet/ethereum/sepolia

You can check the wallet balance on:

https://sepolia.etherscan.io

---

## Step 3 — Configure Alchemy

Create an Alchemy application for Ethereum Sepolia:

https://www.alchemy.com

Add the RPC URLs to `.env.local`:

```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/<YOUR_ALCHEMY_KEY>

NEXT_PUBLIC_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/<YOUR_ALCHEMY_KEY>

NEXT_PUBLIC_RPC_WSS_URL=wss://eth-sepolia.g.alchemy.com/v2/<YOUR_ALCHEMY_KEY>
```

The first variable is used by Hardhat.

The `NEXT_PUBLIC_` variables are used by the browser.

---

## Step 4 — Compile and Deploy

Compile:

```bash
npx hardhat compile
```

Deploy:

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

The script prints:

* Deployer address
* Wallet balance
* Contract address
* Etherscan URL

Copy the contract address.

---

## Step 5 — Update the Frontend

Update:

```text
context/Constants.tsx
```

with the newly deployed Sepolia contract address:

```ts
export const votingAddress = "0xYOUR_CONTRACT_ADDRESS";
```

Then update the read provider in:

```text
context/Voter.tsx
```

to:

```ts
const provider = new ethers.JsonRpcProvider(
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL
);
```

Restart the Next.js development server after changing `.env.local`.

---

## Step 6 — Set the Deployment Block

The results page reads blockchain events.

For Sepolia, set the contract deployment block in:

```text
app/results/page.tsx
```

using the block number containing the contract creation transaction.

This prevents the application from unnecessarily scanning the entire Sepolia blockchain.

---

## Step 7 — Start the Frontend

```bash
npx next dev --webpack --port 3005
```

Open:

```text
http://localhost:3005
```

---

## Step 8 — Configure MetaMask for Sepolia

Switch MetaMask to:

```text
Sepolia
```

Make sure the active account is the wallet that deployed the contract.

The deployer is the organizer and therefore has the permissions required for administrative operations.

Then connect the wallet to the application.

---

# 🔎 Contract Verification

Contract verification is optional but recommended for public demos.

Verification publishes the Solidity source code on Etherscan and makes the contract easier to inspect.

## Etherscan API Key

Create an API key:

https://etherscan.io/myapikey

Add it to `.env.local`:

```env
ETHERSCAN_API_KEY=<your_etherscan_api_key>
```

Your `hardhat.config.ts` should contain:

```ts
const config: HardhatUserConfig = {
  solidity: "0.8.28",

  networks: {
    hardhat: {
      chainId: 31337,
    },

    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },

    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
    },
  },

  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
  },
};

export default config;
```

Then verify:

```bash
npx hardhat verify --network sepolia <YOUR_CONTRACT_ADDRESS>
```

The contract in this project has no constructor arguments, so no additional arguments are required.

After verification, Etherscan will display the verified Solidity source and Read/Write Contract interfaces.

---

# 🔁 Switching Between Local and Sepolia

| Configuration    | Local                    | Sepolia                    |
| ---------------- | ------------------------ | -------------------------- |
| Hardhat node     | ✅ Required               | ❌ Not required             |
| Chain ID         | `31337`                  | `11155111`                 |
| Deployment       | `--network localhost`    | `--network sepolia`        |
| Contract address | Local deployment address | Sepolia deployment address |
| Read provider    | `127.0.0.1:8545`         | Alchemy Sepolia RPC        |
| MetaMask         | Hardhat Local            | Sepolia                    |
| Wallet           | Hardhat test account     | Dedicated Sepolia wallet   |
| ETH              | Fake ETH                 | Sepolia test ETH           |

> **Important:** Whenever you deploy a new contract, update the contract address in `context/Constants.tsx`.

---

# 🗳️ Typical Usage Flow

1. Connect the organizer wallet.
2. Open the **Admin** page.
3. Configure the voting period if necessary.
4. Register candidates.
5. Register authorized voters.
6. Switch MetaMask to a registered voter account.
7. Open the candidate list.
8. Cast a vote.
9. Open the Results page.
10. View the winner, tie status, and voting events.

---

# ⚡ Round 2

The smart contract cannot execute transactions by itself.

The application therefore uses a frontend-triggered mechanism for Round 2.

After the voting period ends:

1. The frontend checks whether Round 2 is required.
2. If a tie exists or no votes were cast, it calls:

   ```solidity
   triggerRound2IfNeeded()
   ```
3. The contract verifies that:

   * The voting period has ended.
   * Round 2 has not already been triggered.
   * The election requires another round.
4. The contract starts Round 2 and resets active candidates' vote counts.

The frontend periodically checks for this condition while the application is open.

> **Important:** This is not fully autonomous blockchain automation. A transaction must be submitted by a user or an external service.

For truly automatic execution when nobody has the application open, an off-chain automation service such as Chainlink Automation would be required.

---

# 🗂️ Project Structure

```text
voting_app/
├── app/
│   ├── admin/
│   ├── allowed-voters/
│   ├── candidate-list/
│   ├── candidate-registration/
│   ├── results/
│   ├── voter-list/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── Button/
│   ├── Card/
│   ├── Footer/
│   ├── Input/
│   ├── Navbar/
│   ├── StatusBanner.tsx
│   └── VoterCard/
│
├── context/
│   ├── Constants.tsx
│   └── Voter.tsx
│
├── contracts/
│   └── voting_contracts.sol
│
├── public/
│   └── images
│
├── scripts/
│   └── deploy.js
│
├── .env.example
├── .gitignore
├── hardhat.config.ts
├── next.config.ts
├── package.json
├── package-lock.json
├── README.md
├── tsconfig.json
└── tsconfig.next.json
```

> `.env.local`, `node_modules`, `.next`, `artifacts`, and `cache` are intentionally excluded from the repository.

---

# 🧰 Useful Commands

| Command                                                 | Purpose                        |
| ------------------------------------------------------- | ------------------------------ |
| `npm install`                                           | Install dependencies           |
| `npx hardhat compile`                                   | Compile the smart contract     |
| `npx hardhat node`                                      | Start the local blockchain     |
| `npx hardhat run scripts/deploy.js --network localhost` | Deploy locally                 |
| `npx hardhat run scripts/deploy.js --network sepolia`   | Deploy to Sepolia              |
| `npx hardhat verify --network sepolia <address>`        | Verify the contract            |
| `npx hardhat clean`                                     | Remove Hardhat generated files |
| `npx next dev --webpack --port 3005`                    | Start the frontend             |
| `npm run build`                                         | Create a production build      |

---

# 🩺 Troubleshooting

| Problem                                    | Possible Cause                        | Solution                                             |
| ------------------------------------------ | ------------------------------------- | ---------------------------------------------------- |
| `Cannot find module ... VotingSystem.json` | Contract has not been compiled        | Run `npx hardhat compile`                            |
| `Failed to fetch`                          | Wrong or unavailable RPC              | Check the provider configuration                     |
| `No signer found`                          | Missing or incorrect private key      | Check `DEPLOYER_PRIVATE_KEY`                         |
| `insufficient funds`                       | Sepolia wallet has no test ETH        | Get Sepolia ETH from a faucet                        |
| Admin actions fail                         | Wrong MetaMask account                | Connect the deploying/organizer account              |
| MetaMask shows `Nonce too high` locally    | Hardhat node was restarted            | Reset the MetaMask account                           |
| `fs / net / tls is not defined`            | Next.js started with Turbopack        | Use `npx next dev --webpack --port 3005`             |
| `window.ethereum is undefined`             | MetaMask unavailable or incorrect URL | Use MetaMask and open `http://localhost:3005`        |
| Images fail with `401 Unauthorized`        | Invalid or expired Pinata JWT         | Regenerate the JWT and restart Next.js               |
| Results fail with RPC errors               | Too many blockchain queries           | Set the deployment block and use a suitable RPC      |
| Etherscan shows raw selectors              | Contract is not verified              | Run `npx hardhat verify --network sepolia <address>` |
| Port `3000` unavailable                    | Windows/Hyper-V port reservation      | Use `--port 3005`                                    |

---

# 🚀 Quick Start

## Local Development

```bash
npm install

# Terminal 1
npx hardhat compile
npx hardhat node

# Terminal 2
npx hardhat run scripts/deploy.js --network localhost

# Terminal 3
npx next dev --webpack --port 3005
```

Open:

```text
http://localhost:3005
```

Configure MetaMask for:

```text
Hardhat Local
Chain ID: 31337
RPC: http://127.0.0.1:8545
```

---

## Sepolia

Configure `.env.local` with your own credentials:

```env
NEXT_PUBLIC_PINATA_JWT=<your_pinata_jwt>
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/<YOUR_ALCHEMY_KEY>
DEPLOYER_PRIVATE_KEY=0x<your_private_key>
ETHERSCAN_API_KEY=<your_etherscan_api_key>
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/<YOUR_ALCHEMY_KEY>
NEXT_PUBLIC_RPC_WSS_URL=wss://eth-sepolia.g.alchemy.com/v2/<YOUR_ALCHEMY_KEY>
```

Then:

```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia
```

Copy the deployed contract address into:

```text
context/Constants.tsx
```

Configure the frontend to use the Sepolia provider, then:

```bash
npx next dev --webpack --port 3005
```

Open:

```text
http://localhost:3005
```

Optional contract verification:

```bash
npx hardhat verify --network sepolia <YOUR_CONTRACT_ADDRESS>
```

View the contract on:

```text
https://sepolia.etherscan.io/address/<YOUR_CONTRACT_ADDRESS>
```

---

# 🔒 Security Notice

This project is intended for **development and educational purposes**.

Do not use the default Hardhat private keys on public networks.

Never commit:

```text
.env.local
```

Never expose:

```text
DEPLOYER_PRIVATE_KEY
```

or any other private credential.

Always use a dedicated testnet wallet for Sepolia development.
