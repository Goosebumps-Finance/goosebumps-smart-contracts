// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  
  // Bsc Mainnet
  // const _router = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
  
  // Ethereum Mainnet
  // Ropsten, Rinkeby
  // const _router = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  
  // Bsc Testnet
  // const _router = "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3";

  // Test with mnemonic accounts
  // const _marketingWallet = "0x69000D6Da4eedf452a1e2048BEeEc901BcdCE82E";
  // const _teamWallet = "0x69000D6Da4eedf452a1e2048BEeEc901BcdCE82E";

  // const Empire = await ethers.getContractFactory("Empire");
  // const empire = await Empire.deploy(_router, _marketingWallet, _teamWallet);

  // await empire.deployed();

  // console.log("Empire deployed to:", empire.address);

  // Roburna testnet
  // const _router = "0x1dc6b36afE2C71042CfA07314330C7fdCC6dF40b";
  // const _marketingWallet = "0x90be9043A6603c0458dfbD4a1442372C599DC777";
  // const _teamWallet = "0x3Cc26212500aA1BB56321f1af536Ee13C99CB97B";
  // const _liquidityWallet = "0x66B0beacE85679Cafb5b2547E4D12dF1011285C9";

  // const Empire = await ethers.getContractFactory("Empire");
  // const empire = await Empire.deploy(_router, _marketingWallet, _teamWallet, _liquidityWallet);
  
  // await empire.deployed();
  
  // console.log("Empire deployed to:", empire.address);

  // BSC mainnet to deploy latest version
  const _router = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
  const _marketingWallet = "0x7b72c66922170026B1f2cB761E1Db1795135fFcc";
  const _teamWallet = "0x69563591018Ae4291710896A482936df51f31Fb9";
  const _liquidityWallet = "0xfB3b7AFC05374080060a9c0bfd7E4a23f534Cca4";
  
  const Empire = await ethers.getContractFactory("Empire");
  const empire = await Empire.deploy(_router, _marketingWallet, _teamWallet, _liquidityWallet);
  
  await empire.deployed();
  
  console.log("Empire deployed to:", empire.address);

  const _ownerWallet = "0x756625662E6cDE375Ae77e01938F87274a64Efcd";
  
  const tx = await empire.transferOwnership(_ownerWallet);

  const txResult = await tx.wait();
  console.log("transferOwnership txHash: ", txResult.transactionHash);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
