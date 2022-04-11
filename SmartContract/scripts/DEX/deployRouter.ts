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

  const factory = "0x75C821CCD003CC9E9Ea06008fAf9Ab8189B1EC56"; // BSC Testnet Factory Address
  const WBNB = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd"; // BSC Testnet WBNB Address
  // We get the contract to deploy
  const GooseBumpsSwapRouter02 = await ethers.getContractFactory("GooseBumpsSwapRouter02");
  const gooseBumpsSwapRouter02 = await GooseBumpsSwapRouter02.deploy(factory, WBNB);

  await gooseBumpsSwapRouter02.deployed();
  
  console.log("GooseBumpsSwapRouter02 deployed to:", gooseBumpsSwapRouter02.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
