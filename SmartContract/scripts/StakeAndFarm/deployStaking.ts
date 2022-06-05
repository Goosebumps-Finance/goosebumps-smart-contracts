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

  const _stakeToken = ""
  const _rewardsToken = ""
  const _treasury = ""
  const _rewardWallet = ""
  const _rewardPerBlockTokenN = ""
  const _rewardPerBlockTokenD = ""

  const GooseBumpsStaking = await ethers.getContractFactory("GooseBumpsStaking");
  const gooseBumpsStaking = await GooseBumpsStaking.deploy(_stakeToken, _rewardsToken, _treasury, _rewardWallet, _rewardPerBlockTokenN, _rewardPerBlockTokenD);

  await gooseBumpsStaking.deployed();

  console.log("GooseBumpsStaking deployed to:", gooseBumpsStaking.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
