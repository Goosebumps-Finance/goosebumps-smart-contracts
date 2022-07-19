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

  const _stakeToken = "0xE7C6D00B5314EE2651Df6E18e84d6d6dF0EA96a6";
  const _rewardsToken = "0xf674Ddfd4e2Fb34D36496B77715409127fBDEfEd";
  const _treasury = "0xC1cb7F497D5CAE9877423AF91a7ab5b8e083AE11";
  const _rewardWallet = "0x69000D6Da4eedf452a1e2048BEeEc901BcdCE82E";
  const _rewardPerBlockTokenN = 100;
  const _rewardPerBlockTokenD = 100;

  const GoosebumpsStakingWithFixedLockTimeAndReflection = await ethers.getContractFactory("GoosebumpsStakingWithFixedLockTimeAndReflection");
  const goosebumpsStakingWithFixedLockTimeAndReflection = await GoosebumpsStakingWithFixedLockTimeAndReflection.deploy(_stakeToken, _rewardsToken, _treasury, _rewardWallet, _rewardPerBlockTokenN, _rewardPerBlockTokenD);

  await goosebumpsStakingWithFixedLockTimeAndReflection.deployed();

  console.log("GoosebumpsStakingWithFixedLockTimeAndReflection deployed to:", goosebumpsStakingWithFixedLockTimeAndReflection.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
