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

  const _stakeToken = "0x62dD0864C5B85A97045BC841764f449Cdb8ac6bB";
  const _treasury = "";

  const ReflectionsDistributor = await ethers.getContractFactory("ReflectionsDistributor");
  const reflectionsDistributor = await ReflectionsDistributor.deploy(_stakeToken, _treasury);

  await reflectionsDistributor.deployed();

  console.log("ReflectionsDistributor deployed to:", reflectionsDistributor.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
