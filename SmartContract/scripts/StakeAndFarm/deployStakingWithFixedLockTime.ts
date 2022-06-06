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

  const _stakeToken = "0xD6cf8aeEeBf84C43e28934D6D743820195BBa59C";
  const _rewardsToken = "0xA1a83bC7712f65E646933a5E00A90537Fc847835";
  const _treasury = "0x69000D6Da4eedf452a1e2048BEeEc901BcdCE82E";
  const _rewardWallet = "0x69000D6Da4eedf452a1e2048BEeEc901BcdCE82E";
  const _rewardPerBlockTokenN = 100;
  const _rewardPerBlockTokenD = 100;

  const GooseBumpsStakingWithFixedLockTime = await ethers.getContractFactory("GooseBumpsStakingWithFixedLockTime");
  const gooseBumpsStakingWithFixedLockTime = await GooseBumpsStakingWithFixedLockTime.deploy(_stakeToken, _rewardsToken, _treasury, _rewardWallet, _rewardPerBlockTokenN, _rewardPerBlockTokenD);

  await gooseBumpsStakingWithFixedLockTime.deployed();

  console.log("GooseBumpsStakingWithFixedLockTime deployed to:", gooseBumpsStakingWithFixedLockTime.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
