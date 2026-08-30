# 🗳️ Voting App — Complete Setup Guide

A decentralized voting application (DApp) that runs in **two modes**:

- **Local mode** — a Hardhat blockchain on your own machine. Fast, free, instant. Best for development and testing.
- **Sepolia mode** — Ethereum's public test network. Slower and uses (free) test ETH, but gives you a real, shareable **Etherscan link**. Best for demos.

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 |
| Smart contract | Solidity 0.8.28 · OpenZeppelin 5 (AccessControl, ReentrancyGuard, Pausable) |
| Blockchain (local) | Hardhat node — `localhost`, chainId `31337` |
| Blockchain (public) | Sepolia testnet — chainId `11155111` |
| Blockchain ↔ frontend bridge | ethers.js v6 |
| Wallet | MetaMask |
| Image storage | IPFS via Pinata |
| RPC provider (Sepolia) | Alchemy (free tier) |

---

## 📋 Prerequisites

1. **Node.js ≥ 20** (tested with Node 22) — [nodejs.org](https://nodejs.org)
   ```bash
   node -v   # v20.x or higher
   npm -v
   ```
2. **MetaMask** browser extension — [metamask.io](https://metamask.io)
3. A code editor (VS Code recommended).
4. **For Sepolia mode only:**
   - A free **Alchemy** account (for the RPC URL) — [alchemy.com](https://www.alchemy.com)
   - A small amount of free **Sepolia test ETH** (from a faucet — see Sepolia Step 2).
   - A free **Etherscan** API key if you want to verify the contract — [etherscan.io/myapikey](https://etherscan.io/myapikey)
5. A free **Pinata** account (for IPFS image storage) — [pinata.cloud](https://www.pinata.cloud) — used in **both** modes.

---

## ⚠️ Read this BEFORE running (classic pitfalls)

1. **Always compile first.**
   `context/Constants.tsx` imports `artifacts/contracts/voting_contracts.sol/VotingSystem.json`, which **does not exist** until you run `npx hardhat compile`. Without it, the frontend won't start.

2. **The contract address must match your deployment.**
   In `context/Constants.tsx`:
   ```ts
   export const votingAddress = "0x...";
   ```
   This must be the address printed by your **most recent deploy**.
   - On a **fresh local node**, the first deployment is always `0x5FbDB2315678afecb367f032d93F642f64180aa3`.
   - On **Sepolia**, it's a unique address printed by the deploy script — copy it in every time you redeploy.
   👉 **Any time you redeploy (local restart OR Sepolia), update this value.**

   > ℹ️ **Why the address is what it is:** a contract address = `keccak256(rlp(deployerAddress, nonce))`, last 20 bytes. It's derived purely from your deployer wallet and its transaction count (nonce) — never random. That's why a fresh local node always gives `0x5FbD…aa3` (account #0 at nonce 0), and why every redeploy produces a new address.

3. **The `--webpack` flag is mandatory.**
   `next.config.ts` has custom webpack fallbacks (`fs`, `net`, `tls`) needed by `ipfs-http-client`. Next.js 16 defaults to **Turbopack**, which ignores this config and errors on startup.
   👉 Always run the frontend with `npx next dev --webpack`.

4. **Port 3000 may be blocked on Windows** (reserved by Hyper-V, gives `EACCES`).
   👉 Use a different port: `npx next dev --webpack --port 3005`.

5. **Open the app at `localhost`, never the network IP.**
   MetaMask only injects `window.ethereum` in a "secure context" — `localhost`/`127.0.0.1` count, but a raw LAN IP like `172.x.x.x` does not. Always use `http://localhost:3005`.

---

## 🔐 Environment variables — `.env.local`

Create a file named `.env.local` in the project root. What you need depends on the mode:

```bash
# ── IPFS image storage (BOTH modes) ────────────────────────────
NEXT_PUBLIC_PINATA_JWT=<your_pinata_jwt>

# ── Sepolia mode only ──────────────────────────────────────────
# Used by Hardhat (deploy script, Node side):
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/<YOUR_ALCHEMY_KEY>
DEPLOYER_PRIVATE_KEY=0x<your_sepolia_wallet_private_key>

# Used by Hardhat to verify the contract on Etherscan (optional, Sepolia):
ETHERSCAN_API_KEY=<your_etherscan_api_key>

# Used by the browser (results page + live feed):
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/<YOUR_ALCHEMY_KEY>
NEXT_PUBLIC_RPC_WSS_URL=wss://eth-sepolia.g.alchemy.com/v2/<YOUR_ALCHEMY_KEY>
```

**Notes:**
- The Alchemy **https** URL is listed twice on purpose — once without a prefix (Hardhat/Node), once with `NEXT_PUBLIC_` (browser). Next.js only exposes `NEXT_PUBLIC_*` variables to browser code.
- The **wss** URL (WebSocket) powers the real-time Live feed.
- **Restart the dev server after any change to `.env.local`** — env vars are only read at startup. A page reload is **not** enough; you must fully stop (Ctrl+C) and restart `next dev`, or the browser keeps seeing the old (or `undefined`) `NEXT_PUBLIC_*` values.

> 🚨 **Security:**
> - Never commit `.env.local` or share it (it's already in `.gitignore`).
> - Use a **dedicated Sepolia-only wallet** for `DEPLOYER_PRIVATE_KEY` — never a wallet holding real funds.
> - If a key ever leaks (Pinata JWT, Alchemy key, private key), **revoke/regenerate it** immediately.
> - Anything prefixed `NEXT_PUBLIC_` is visible in the browser by design. For Alchemy, you can add a domain allowlist in the dashboard to limit abuse.

> ℹ️ **Pinata images are permanent.** If you only regenerate your Pinata JWT, you do **not** need to re-upload existing images — they stay on IPFS at their existing URLs. The key only affects *new* uploads.

---

# 🟢 MODE A — Local development (Hardhat)

Fast, free, instant. No faucet, no real network. You'll need **3 terminals**, all inside `voting_app/`.

### Step 1 — Install dependencies
```bash
cd voting_app
npm install
```
> `ethers` v6 is included in `package.json`. If for any reason it's missing, add it: `npm install ethers@^6`.

### Step 2 — Compile the contract *(Terminal 1)*
```bash
npx hardhat compile
```
✅ Creates `artifacts/` (ABI + bytecode). Required before anything else.

### Step 3 — Start the local blockchain *(Terminal 1, keep running)*
```bash
npx hardhat node
```
✅ Starts a node at `http://127.0.0.1:8545` (chainId `31337`) and prints 20 test accounts, each with 10,000 fake ETH.
**⚠️ Don't close this terminal** — the blockchain only exists while it runs. Restarting it resets everything.

Account #0 (the default organizer) on a standard Hardhat node:
```
Address     : 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private key : 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```
> 🔒 These are **well-known public test keys** with no real value. NEVER use them on a public network — on Sepolia or mainnet, bots will drain anything sent to them.

### Step 4 — Deploy the contract *(Terminal 2)*
```bash
npx hardhat run scripts/deploy.js --network localhost
```
✅ Prints the contract address. On a fresh node it's `0x5FbDB2315678afecb367f032d93F642f64180aa3` — matching `Constants.tsx`. 🎯
> If it's different, copy it into `votingAddress` in `context/Constants.tsx`.

> 🏛️ The deploying account becomes the **organizer/admin** (`DEFAULT_ADMIN_ROLE` + `ORGANIZER_ROLE`). Voting opens for **45 minutes** from deployment.

### Step 5 — Make sure the frontend points at the local node
In `context/Voter.tsx`, the read provider should target the local node for local mode:
```ts
const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
```
(See "Switching modes" below — this one line is what you flip between local and Sepolia.)

### Step 6 — Start the frontend *(Terminal 3)*
```bash
npx next dev --webpack --port 3005
```
✅ Open **http://localhost:3005**.

### Step 7 — Configure MetaMask (local)
1. **Add the Hardhat network:** Settings → Networks → *Add network manually*
   - Name: `Hardhat Local` · RPC: `http://127.0.0.1:8545` · Chain ID: `31337` · Symbol: `ETH`
2. **Import account #0** (the organizer): account menu → *Import account* → paste the private key from Step 3.
3. (Optional) Import accounts #1, #2… to simulate voters.
4. Click **Connect wallet** on the site and approve.

---

# 🔵 MODE B — Sepolia testnet (public, shareable)

Gives you a real Etherscan link. Uses free test ETH. **No `hardhat node`** — Sepolia already exists on the internet.

### Step 1 — Create a dedicated Sepolia wallet
1. In MetaMask: account menu → **Add account** → name it e.g. "Sepolia Dev". This generates a fresh private key only you know.
2. Copy its **address**.
3. Export its **private key** (⋮ → Account details → Show private key) and put it in `.env.local`:
   ```bash
   DEPLOYER_PRIVATE_KEY=0x...
   ```
   (Must start with `0x`, 66 characters total.)
> ⚠️ Do **not** use the public Hardhat key (`0xf39Fd6…`) on Sepolia — it's shared worldwide and gets drained by bots, so it can never hold a balance long enough to deploy.

### Step 2 — Get free Sepolia test ETH
You only need a tiny amount (deployment costs ≈ **0.0086 ETH**; 0.05 is plenty). Paste your new address into a faucet:
- **Google Cloud faucet** — https://cloud.google.com/application/web3/faucet/ethereum/sepolia (Google login, no mainnet ETH needed)
- **PoW faucet** — https://sepolia-faucet.pk910.de (mine in-browser, no account, no mainnet ETH needed)
- **Alchemy / QuickNode** — fast, but require a small mainnet ETH balance to qualify

Confirm the balance landed: paste your address into https://sepolia.etherscan.io

### Step 3 — Get an Alchemy RPC URL
1. Sign up at [alchemy.com](https://www.alchemy.com), create an app on the **Ethereum Sepolia** network.
2. Copy both the **https** URL and the **wss** (WebSocket) URL.
3. Put them in `.env.local` (see the env section above): `SEPOLIA_RPC_URL`, `NEXT_PUBLIC_SEPOLIA_RPC_URL` (both = https URL), and `NEXT_PUBLIC_RPC_WSS_URL` (= wss URL).

### Step 4 — Compile & deploy to Sepolia
```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia
```
✅ The script prints the deployer address, balance, the new **contract address**, and an **Etherscan link**.
> If you see "insufficient funds" → the wallet has no test ETH (redo Step 2).
> If you see "No signer found" → check `DEPLOYER_PRIVATE_KEY` has the `0x` prefix and matches the `accounts` field in `hardhat.config.ts`.

### Step 5 — Point the frontend at Sepolia
1. In `context/Constants.tsx`, set `votingAddress` to the **new** address from Step 4.
2. In `context/Voter.tsx`, set the read provider to your Sepolia RPC:
   ```ts
   const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL);
   ```
3. Note your **deploy block number** (from the contract-creation tx on Etherscan) and set `DEPLOY_BLOCK` in `app/results/page.tsx` to it. This stops the results page from scanning millions of blocks (which the free RPC tier rejects).

### Step 6 — Start the frontend
```bash
npx next dev --webpack --port 3005
```
✅ Open **http://localhost:3005**.

### Step 7 — Configure MetaMask (Sepolia)
1. Switch MetaMask to the **Sepolia** network (it's built in — enable "Show test networks" in settings if hidden).
2. **Set Sepolia's RPC URL to your own Alchemy https endpoint** (network dropdown → edit Sepolia → Default RPC URL = your `NEXT_PUBLIC_SEPOLIA_RPC_URL`). MetaMask's *built-in* Sepolia RPC is shared and rate-limited, and its background block poller will spam `-32002` errors while the app is open. The currency symbol (`ETH` vs `SepoliaETH`) is cosmetic and doesn't matter.
3. Make sure the **active account is your deployer wallet** (the one from Step 1) — it's the organizer, so admin actions (register, pause, etc.) only work from it.
4. Click **Connect wallet** and approve.

### Step 8 — View it on Etherscan
Your public link: `https://sepolia.etherscan.io/address/<your-contract-address>`
Every vote and registration is publicly visible there. 🎉

### Step 9 — (Optional) Verify the contract on Etherscan
Verifying publishes your Solidity source alongside the deployed bytecode. Etherscan then shows readable function names (e.g. **Set Voter** instead of the raw selector `0x3a5c4d42`), a green checkmark, and Read/Write Contract tabs.

1. Get a free API key at https://etherscan.io/myapikey and add `ETHERSCAN_API_KEY` to `.env.local`.
2. Ensure `hardhat.config.ts` has an `etherscan` block **at the top level** — a sibling of `networks` and `solidity`, **not** nested inside `networks`:
   ```ts
   const config: HardhatUserConfig = {
     solidity: "0.8.28",
     networks: {
       hardhat: { chainId: 31337 },
       localhost: { url: "http://127.0.0.1:8545", chainId: 31337 },
       sepolia: {
         url: process.env.SEPOLIA_RPC_URL || "",
         accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
       },
     },
     etherscan: {
       apiKey: process.env.ETHERSCAN_API_KEY || "",
     },
   };
   ```
3. Verify, passing the **same constructor arguments** used at deploy (omit them if the constructor takes none):
   ```bash
   npx hardhat verify --network sepolia <your-contract-address>
   ```

> 🔎 The address you pass is the **contract** address (the same value as `votingAddress`), not your wallet address and not a transaction hash.
> 🧩 Inherited OpenZeppelin contracts (AccessControl, Pausable, ReentrancyGuard) compile **into** your single contract — one verify covers them all. Only *separately deployed* contracts each need their own verify call.
> 🏷️ Before verifying, Etherscan labels methods from a public 4-byte database, so common selectors get friendly names while yours show raw hex (e.g. `0x3a5c4d42`). Verifying replaces all of those with your real function names.

---

## 🔁 Switching between local and Sepolia

Flipping modes comes down to a few touch points:

| What | Local | Sepolia |
|---|---|---|
| Run `npx hardhat node`? | ✅ yes | ❌ no |
| Deploy command | `--network localhost` | `--network sepolia` |
| `votingAddress` in `Constants.tsx` | `0x5FbD…aa3` | your Sepolia address |
| Read provider in `Voter.tsx` | `new ethers.JsonRpcProvider('http://127.0.0.1:8545')` | `new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL)` |
| MetaMask network | Hardhat Local (31337) | Sepolia (11155111) |
| MetaMask account | imported Hardhat #0 | your Sepolia deployer wallet |
| Test ETH | free & automatic | from a faucet |

> 💡 Tip: a `BrowserProvider(window.ethereum)` read provider would auto-follow whichever network MetaMask is on, avoiding the manual flip — but an explicit RPC is more reliable for read-heavy pages (results/live), so this project uses explicit RPCs.

---

## 🧭 Typical usage flow

1. Connect with the **organizer account** (Hardhat #0 locally, or your deployer wallet on Sepolia).
2. Go to **Admin**: set the voting period if needed, register **candidates** (`/candidate-registration`) and **authorized voters** (`/allowed-voters`).
3. Switch to a **registered voter** account in MetaMask.
4. Open the candidate list and **vote**.
5. Check **results** (`/results`): winner, tie, and the **Round 2** trigger.

---

## ⚡ About "automatic" Round 2

Smart contracts can't run themselves — nothing executes on-chain without a transaction. So Round 2 is **frontend-triggered**, not self-executing:

- After the deadline, if the result is a **tie** (or zero votes), the app calls `triggerRound2IfNeeded()` automatically on a 30-second poll (`handleRound2Logic` in `context/Voter.tsx`).
- This only fires **while someone has the app open** after the deadline; that user pays the (test) gas.
- The contract enforces the rules (must be past the deadline, must be a genuine tie, only once).

On Sepolia the default window is 45 minutes and blocks confirm every ~12s, so to test Round 2 quickly, the organizer can use `setVotingPeriod` to set a short window, let it expire, then keep the app open for the poll to fire.

> True hands-off automation (firing with nobody watching) would require an off-chain keeper like Chainlink Automation — out of scope for this project.

---

## 🗂️ Project structure

```
voting_app/
├── app/                      # Next.js pages (App Router)
│   ├── page.tsx              # Home + Live "War Room" feed
│   ├── admin/                # Organizer dashboard (pause, deactivate, etc.)
│   ├── candidate-registration/
│   ├── candidate-list/       # Browse candidates + cast vote
│   ├── allowed-voters/
│   ├── voter-list/
│   ├── results/              # Audit log + winner (reads on-chain events)
│   └── layout.tsx            # Wraps app with VotingProvider
├── components/               # Button, Card, Navbar, Footer, Input, VoterCard
├── context/
│   ├── Voter.tsx             # Blockchain logic (connect, vote, read, Round 2…)
│   └── Constants.tsx         # Contract address + ABI
├── contracts/
│   └── voting_contracts.sol  # VotingSystem smart contract
├── scripts/
│   └── deploy.js             # Deployment script (local + Sepolia)
├── hardhat.config.ts         # Hardhat network config (localhost + sepolia + etherscan)
├── next.config.ts            # Next.js config (webpack + IPFS)
├── .env.local                # Keys (create it; never commit)
└── package.json
```

---

## 🧰 Useful commands

| Command | Purpose |
|---|---|
| `npx hardhat compile` | Compile the contract → generates `artifacts/` (ABI) |
| `npx hardhat node` | Start the local blockchain (local mode only) |
| `npx hardhat run scripts/deploy.js --network localhost` | Deploy locally |
| `npx hardhat run scripts/deploy.js --network sepolia` | Deploy to Sepolia |
| `npx hardhat verify --network sepolia <address>` | Publish source to Etherscan (readable method names) |
| `npx hardhat clean` | Clear cache/artifacts (on compile errors) |
| `npx next dev --webpack --port 3005` | Run the frontend in development |
| `npm run build` | Production build (Next.js) |

---

## 🩺 Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `Cannot find module '.../VotingSystem.json'` | Not compiled | `npx hardhat compile` |
| Frontend loads but nothing shows / `Failed to fetch` | Read provider points at a node that isn't running, or stale `votingAddress` | Match provider in `Voter.tsx` to your mode; update `votingAddress` |
| Deploy: `No signer found` / `Cannot read properties of undefined` | `DEPLOYER_PRIVATE_KEY` missing/wrong name or no `0x` | Fix the key in `.env.local`; ensure config reads the same name |
| Deploy: `insufficient funds for gas` | Sepolia wallet has 0 ETH | Get test ETH from a faucet (Sepolia Step 2) |
| Deploy shows address `0xf39Fd6…` with 0 ETH | Using the public Hardhat key on Sepolia | Use your own dedicated Sepolia wallet's key |
| MetaMask spams `-32002` / `getLatestBlock` errors | MetaMask polling its *default* rate-limited Sepolia RPC | Edit MetaMask's Sepolia network → set RPC URL to your Alchemy https endpoint |
| Connected but app shows **guest** / no role | Reads in `loadUserStatus` failing silently (caught) | Fully restart `next dev` after editing `.env.local` (so `NEXT_PUBLIC_SEPOLIA_RPC_URL` loads); confirm `votingAddress` has code on Etherscan; check the browser console for `Status load error` |
| Results page: `-32002 too many errors` (via MetaMask) | Reading through MetaMask's rate-limited public RPC | Use `NEXT_PUBLIC_SEPOLIA_RPC_URL` (Alchemy) as the provider; raise poll interval |
| Results page: `-32002` from your *own* Alchemy key | `queryFilter` chunk too small (`from += 10`) → thousands of calls | Use a large chunk (~2000 blocks) and scan incrementally from the last-seen block |
| Results page: `Failed to fetch` flood | `queryFilter(..., 0)` scans from block 0 | Set `DEPLOY_BLOCK` to the contract creation block |
| Etherscan shows raw `0x…` instead of a method name | Contract not verified | Run `npx hardhat verify` (Sepolia Step 9) |
| Image upload fails with `401 Unauthorized` | Missing/expired Pinata JWT | Create a new JWT, set `NEXT_PUBLIC_PINATA_JWT`, restart server |
| Admin actions fail / `AccessControlUnauthorizedAccount` | Connected account isn't the organizer | Switch MetaMask to the deploying wallet |
| MetaMask: `Nonce too high` / stuck tx (local) | Hardhat node restarted (chain reset) | MetaMask: account → Advanced → *Reset account* |
| `fs / net / tls is not defined` at startup | Launched without webpack (Turbopack) | Use `npx next dev --webpack` |
| `window.ethereum is undefined` | MetaMask missing, or opened via LAN IP | Install MetaMask; open via `http://localhost:3005` |
| Port `EACCES` on 3000 (Windows) | Port reserved by Hyper-V | Use `--port 3005` |

---

## 📝 Quick recap

**Local:**
```bash
cd voting_app && npm install
npx hardhat compile                                   # Terminal 1
npx hardhat node                                      # Terminal 1 (keep running)
npx hardhat run scripts/deploy.js --network localhost # Terminal 2
npx next dev --webpack --port 3005                    # Terminal 3
# MetaMask: Hardhat Local (31337) + import account #0 → http://localhost:3005
```

**Sepolia:**
```bash
# .env.local has SEPOLIA_RPC_URL, DEPLOYER_PRIVATE_KEY, ETHERSCAN_API_KEY,
#                NEXT_PUBLIC_SEPOLIA_RPC_URL, NEXT_PUBLIC_RPC_WSS_URL, NEXT_PUBLIC_PINATA_JWT
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia   # copy printed address → Constants.tsx
# set DEPLOY_BLOCK in app/results/page.tsx to the creation block
npx next dev --webpack --port 3005
# MetaMask: Sepolia (11155111, RPC = your Alchemy URL) + your deployer wallet → http://localhost:3005
npx hardhat verify --network sepolia <contract>       # optional: readable method names on Etherscan
# View: https://sepolia.etherscan.io/address/<contract>
```

Happy voting! 🗳️


Dear network, dear friends 👋

I'll be honest with you: it's been almost 5 months since my last post here. No big drama — just heads-down, learning, building, and figuring things out quietly. But I missed this space, and I missed sharing the journey with you. So consider this my little note of apology… and my promise that I'm back. 🙏

To make up for the silence, I'd love to show you what I've been tinkering with: a small but complete decentralized Voting App — my warm-up project to step into the world of blockchain.

Under the hood:
• A Solidity smart contract (roles, pausable, reentrancy-safe) running on a local Ethereum network
• A Next.js + React frontend connected through ethers.js
• MetaMask for the wallet, IPFS for storing candidate images
• Voter & candidate registration, live voting, results, and even a second-round mechanism

It's far from perfect — it's a learning project — but I'm genuinely proud of how much clicked while building it. Blockchain went from "buzzword" to "oh, THAT'S how it works" 😄

A quick hello for anyone new here: I'm Zakia Buras, a second-year Cryptography & Information Security student — a passionate builder who began from zero and carries the same big dreams as everyone on this platform. ✨

I didn't wait for permission, a title, or the right introduction to start building this. I just did — and I'll let the work speak for itself.

And I'm open to any opportunity to grow alongside you — because I believe in places where we rise together. 🌱

If you're curious about the source code, want to learn from it, or just want to talk Web3 — my DMs are open. Reach out anytime. 📩

Thank you for sticking around. More to come — this time for real. 🚀

#Blockchain #Web3 #SmartContracts #Solidity #NextJS #Ethereum #BuildingInPublic #smart_contracts #Cybersecurity #ETH #Sepolia