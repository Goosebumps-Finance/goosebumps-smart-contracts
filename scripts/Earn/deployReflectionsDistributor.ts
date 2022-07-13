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
  const _treasury = "0x1ec8081765DC8be426B2020ac70534ee59797199"; // GoosebumpsStakingWithReflection

  const ReflectionsDistributor = await ethers.getContractFactory("ReflectionsDistributor");
  const reflectionsDistributor = await ReflectionsDistributor.deploy(_stakeToken, _treasury);

  await reflectionsDistributor.deployed();

  console.log("ReflectionsDistributor deployed to:", reflectionsDistributor.address);

  const _treasuryWithLockTIme = "0xD34a1237cC5A8794c3E14479d8DbB20765F4803B"; // GoosebumpsStakingWithFixedLockTimeAndReflection

  const reflectionsDistributorWithLockTIme = await ReflectionsDistributor.deploy(_stakeToken, _treasuryWithLockTIme);

  await reflectionsDistributorWithLockTIme.deployed();

  console.log("ReflectionsDistributor deployed to:", reflectionsDistributorWithLockTIme.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
