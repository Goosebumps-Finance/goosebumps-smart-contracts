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

  const factory = "0xDe7ab60427914b4d240CE33F200eb17FE6d0B9AA";
  const WBNB = "0x918f0C3B01d5aC7E2fcBbcEB63616227E96d8FE7"
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
