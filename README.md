# 🗳️ Decentralized Voting DApp

A decentralized voting application built with **Next.js, Ethereum, Solidity, and IPFS**.

Two modes are supported:

* **Local** — runs on a local Hardhat blockchain. Fast, free, ideal for dev/testing.
* **Sepolia** — runs on Ethereum's public testnet. Transactions are publicly verifiable via Etherscan.

## 🛠️ Stack

| Layer                  | Technology                                          |
| ----------------------- | --------------------------------------------------- |
| Frontend                | Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 |
| Smart Contract          | Solidity 0.8.28 · OpenZeppelin 5                    |
| Local Blockchain        | Hardhat · Chain ID `31337`                          |
| Public Blockchain       | Ethereum Sepolia · Chain ID `11155111`              |
| Blockchain Integration  | ethers.js v6                                        |
| Wallet                  | MetaMask                                            |
| Decentralized Storage   | IPFS via Pinata (uploaded through a server route — see below) |
| Sepolia RPC / Verify    | Alchemy / Etherscan                                 |

---

## 📋 Prerequisites

* **Node.js 20+** (tested on 22) — `node -v`
* **MetaMask** browser extension — https://metamask.io
* **Pinata** account for IPFS image uploads — https://www.pinata.cloud
* **Sepolia mode only:** an Alchemy account, a dedicated Sepolia wallet with test ETH, and (optionally) an Etherscan API key for verification.

---

## ⚠️ Before You Run Anything

1. **Compile first** — the frontend imports `artifacts/contracts/voting_contracts.sol/VotingSystem.json`, which only exists after `npx hardhat compile`.
2. **Contract address** — after every deployment, copy the printed address into `context/Constants.tsx` (`export const votingAddress = "0x...";`).
3. **Use Webpack, not Turbopack** — `ipfs-http-client` needs Node modules (`fs`, `net`, `tls`) Turbopack doesn't polyfill. Always start the frontend with:
   ```bash
   npx next dev --webpack --port 3005
   ```
4. **Use `localhost`, not a LAN IP** (`192.168.x.x`) — MetaMask's injected provider only works reliably with `localhost`.

---

## 🔐 Environment Variables

Create `.env.local` at the project root (never commit it — `.env.example` is the template).

```env
# --- Server-side only (never exposed to the browser) ---
PINATA_JWT=<your_pinata_jwt>
ETHERSCAN_API_KEY=<your_etherscan_api_key>
DEPLOYER_PRIVATE_KEY=0x<sepolia_only_dedicated_wallet_key>
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/<ALCHEMY_KEY>

# --- Exposed to the browser (Sepolia mode only) ---
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/<ALCHEMY_KEY>
NEXT_PUBLIC_RPC_WSS_URL=wss://eth-sepolia.g.alchemy.com/v2/<ALCHEMY_KEY>
```

> **`PINATA_JWT` and `ETHERSCAN_API_KEY` must NOT have the `NEXT_PUBLIC_` prefix.** They're read server-side by `app/api/upload/route.ts` and `app/api/logs/route.ts`, which proxy the Pinata and Etherscan calls so the credentials never reach the browser bundle. If you're deploying (Vercel/Netlify/etc.), set both in your host's environment-variable settings too — the app returns a 500 on upload/results otherwise.

**Security basics:** never commit `.env.local` · never publish a private key · use a dedicated, fund-free wallet for Sepolia dev · rotate any credential that leaks · anything actually prefixed `NEXT_PUBLIC_` is genuinely public — never put a secret there.

---

## 🟢 Local Development

Three terminals:

```bash
npm install

# Terminal 1 — compile + run the chain
npx hardhat compile
npx hardhat node                     # http://127.0.0.1:8545, chain ID 31337

# Terminal 2 — deploy
npx hardhat run scripts/deploy.js --network localhost
# first deploy on a fresh node is normally 0x5FbDB2315678afecb367f032d93F642f64180aa3
# → paste the printed address into context/Constants.tsx if different

# Terminal 3 — frontend
npx next dev --webpack --port 3005
```

Open `http://localhost:3005`. In MetaMask, add network **Hardhat Local** (RPC `http://127.0.0.1:8545`, chain ID `31337`, symbol `ETH`), then import Hardhat account #0 (private key printed by `npx hardhat node`) — this account is the organizer (`DEFAULT_ADMIN_ROLE` + `ORGANIZER_ROLE`). Import extra Hardhat accounts to simulate voters. Voting period defaults to **90 minutes** from deployment.

Keep the Hardhat node terminal running — restarting it wipes local chain state (and you'll need to reset the MetaMask account nonce).

---

## 🔵 Sepolia Testnet

No local node needed. Steps:

1. **Dedicated wallet** — create a fresh MetaMask account for dev only, export its key into `.env.local` as `DEPLOYER_PRIVATE_KEY`. Never use a wallet holding real funds.
2. **Test ETH** — fund it from a faucet (e.g. https://cloud.google.com/application/web3/faucet/ethereum/sepolia).
3. **Alchemy** — create a Sepolia app at https://www.alchemy.com, fill in the RPC vars above.
4. **Compile & deploy:**
   ```bash
   npx hardhat compile
   npx hardhat run scripts/deploy.js --network sepolia
   ```
5. **Update the frontend** — paste the new address into `context/Constants.tsx`; point the read provider in `context/Voter.tsx` at `process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL`; set the contract's deployment block in `app/results/page.tsx` (avoids scanning the whole chain for events).
6. **Run:** `npx next dev --webpack --port 3005`, open `http://localhost:3005`, switch MetaMask to **Sepolia** with the deployer account connected.

### Optional: verify on Etherscan

`hardhat.config.ts` already reads `process.env.ETHERSCAN_API_KEY`. Run:
```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```
(no constructor args needed).

---

## 🔁 Local vs Sepolia

| Configuration    | Local                    | Sepolia                    |
| ----------------- | ------------------------- | --------------------------- |
| Hardhat node      | ✅ Required                | ❌ Not required              |
| Chain ID          | `31337`                   | `11155111`                  |
| Deploy command    | `--network localhost`     | `--network sepolia`         |
| Read provider     | `127.0.0.1:8545`          | Alchemy Sepolia RPC         |
| Wallet            | Hardhat test account      | Dedicated Sepolia wallet    |
| ETH               | Fake                      | Sepolia test ETH            |

---

## 🗳️ Typical Usage Flow

Connect organizer wallet → **Admin** page → set voting period if needed → register candidates → register voters → switch MetaMask to a voter account → **Candidates** page → cast vote → **Results** page → winner / tie / event log.

### ⚡ About Round 2

The contract can't execute itself — after the voting period ends, the frontend checks whether Round 2 is needed (tie, or zero votes) and calls `triggerRound2IfNeeded()` as a normal user transaction. This only fires while someone has the app open; for fully autonomous triggering with nobody online, you'd need an off-chain automation service (e.g. Chainlink Automation).

---

## 🗂️ Project Structure

```text
voting_app/
├── app/
│   ├── admin/ · allowed-voters/ · candidate-list/ · candidate-registration/
│   ├── results/ · voter-list/
│   ├── api/upload/route.ts   # Pinata proxy (holds PINATA_JWT server-side)
│   ├── api/logs/route.ts     # Etherscan proxy (holds ETHERSCAN_API_KEY server-side)
│   └── layout.tsx · page.tsx
├── components/         # Navbar, Card, StatusBanner, etc.
├── context/             # Constants.tsx (contract address/ABI), Voter.tsx (provider)
├── contracts/           # voting_contracts.sol
├── scripts/deploy.js
├── .env.example · hardhat.config.ts · next.config.ts · package.json
```
`.env.local`, `node_modules`, `.next`, `artifacts`, `cache` are gitignored.

---

## 🧰 Useful Commands

| Command | Purpose |
| --- | --- |
| `npm install` | Install dependencies |
| `npx hardhat compile` | Compile the contract |
| `npx hardhat node` | Start local chain |
| `npx hardhat run scripts/deploy.js --network localhost\|sepolia` | Deploy |
| `npx hardhat verify --network sepolia <address>` | Verify on Etherscan |
| `npx hardhat clean` | Remove Hardhat build artifacts |
| `npx next dev --webpack --port 3005` | Start frontend (dev) |
| `npm run build` | Production build |

---

## 🩺 Troubleshooting

| Problem | Cause | Fix |
| --- | --- | --- |
| `Cannot find module ... VotingSystem.json` | Not compiled | `npx hardhat compile` |
| `Failed to fetch` | Bad/unavailable RPC | Check provider config |
| `No signer found` | Missing/bad private key | Check `DEPLOYER_PRIVATE_KEY` |
| `insufficient funds` | No Sepolia ETH | Use a faucet |
| Admin actions fail | Wrong MetaMask account | Connect the organizer/deployer account |
| `Nonce too high` locally | Hardhat node restarted | Reset MetaMask account |
| `fs / net / tls is not defined` | Started with Turbopack | Use `--webpack` |
| `window.ethereum is undefined` | No MetaMask / wrong URL | Install MetaMask, use `localhost:3005` |
| Uploads fail / 500 on `/api/upload` | Missing `PINATA_JWT` server env var | Set it in `.env.local` (and host env vars if deployed) |
| Results fail / 500 on `/api/logs` | Missing `ETHERSCAN_API_KEY` server env var | Same as above |
| Etherscan shows raw selectors | Contract not verified | `npx hardhat verify ...` |
| Port `3000` unavailable | Windows/Hyper-V reservation | Use `--port 3005` |

---

## 🔒 Security Notice

Development/educational project.

* Never use Hardhat's default private keys on a public network.
* Never commit `.env.local`.
* Never expose `DEPLOYER_PRIVATE_KEY`, `PINATA_JWT`, or `ETHERSCAN_API_KEY` — these are server-side only, on purpose.
* Use a dedicated, fund-free testnet wallet for Sepolia dev.
