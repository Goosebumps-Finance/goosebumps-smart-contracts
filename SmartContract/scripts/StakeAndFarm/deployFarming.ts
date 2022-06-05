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

  const _lpToken = "0x256C9FbE9093E7b9E3C4584aDBC3066D8c6216da";
  const _rewardsToken = "0x256C9FbE9093E7b9E3C4584aDBC3066D8c6216da";
  const _treasury = "0x256C9FbE9093E7b9E3C4584aDBC3066D8c6216da";
  const _rewardWallet = "0x256C9FbE9093E7b9E3C4584aDBC3066D8c6216da";
  const _rewardPerBlockTokenN = 100;
  const _rewardPerBlockTokenD = 100;

  const GooseBumpsFarming = await ethers.getContractFactory("GooseBumpsFarming");
  const gooseBumpsFarming = await GooseBumpsFarming.deploy(_lpToken, _rewardsToken, _treasury, _rewardWallet, _rewardPerBlockTokenN, _rewardPerBlockTokenD);

  await gooseBumpsFarming.deployed();

  console.log("GooseBumpsFarming deployed to:", gooseBumpsFarming.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
