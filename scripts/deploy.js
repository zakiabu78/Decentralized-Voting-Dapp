const hre = require("hardhat");

// ── DEPLOY TO SEPOLIA ────────────────────────────────────
// Requirements:
//   1) DEPLOYER_PRIVATE_KEY (0x...) + SEPOLIA_RPC_URL in .env.local
//   2) The wallet must hold Sepolia ETH (from a faucet)
// Command:
//   npx hardhat compile
//   npx hardhat run scripts/deploy.js --network sepolia
// ─────────────────────────────────────────────────────────

async function main() {
  console.log("\n==============================================");
  console.log("🚀 DEPLOYMENT START: VotingSystem");
  console.log("==============================================\n");

  // --- NETWORK ---
  const net = await hre.ethers.provider.getNetwork();
  console.log(`🌐 Network: ${net.name} (chainId ${net.chainId})\n`);

  // --- DEPLOYER INFO ---
  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) {
    throw new Error(
      "No signer found. Check DEPLOYER_PRIVATE_KEY (must start with 0x) in .env.local " +
      "and the accounts field in hardhat.config.ts."
    );
  }

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  const nonce = await hre.ethers.provider.getTransactionCount(deployer.address);

  console.log("👤 DEPLOYED BY:");
  console.log(`- Address: ${deployer.address}`);
  console.log(`- Current balance: ${hre.ethers.formatEther(balance)} ETH`);
  console.log(`- Current nonce: ${nonce}`);
  console.log("\n----------------------------------------------");

  // --- GAS CHECK ---
  if (balance === 0n) {
    throw new Error(
      "Balance = 0 ETH. Claim Sepolia ETH for this wallet from a faucet " +
      "(e.g. https://cloud.google.com/application/web3/faucet/ethereum/sepolia) then re-run."
    );
  }

  // --- DEPLOYMENT ---
  console.log("⏳ Deploying and waiting for confirmation...");
  const VotingSystem = await hre.ethers.getContractFactory("VotingSystem");
  const voting = await VotingSystem.deploy();
  await voting.waitForDeployment();
  const contractAddress = await voting.getAddress();

  console.log("\n✅ DEPLOYMENT SUCCESSFUL!");
  console.log("----------------------------------------------");
  console.log(`📍 CONTRACT ADDRESS: ${contractAddress}`);

  // --- ETHERSCAN LINK (Sepolia only) ---
  if (net.chainId === 11155111n) {
    console.log(`🔎 Etherscan: https://sepolia.etherscan.io/address/${contractAddress}`);
  }
  console.log("----------------------------------------------\n");
  console.log("👉 Copy this address into context/Constants.tsx (votingAddress)");
}

main().catch((error) => {
  console.error("❌ DEPLOYMENT ERROR:");
  console.error(error);
  process.exitCode = 1;
});