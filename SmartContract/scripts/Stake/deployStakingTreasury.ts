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

  const _stakingVault = "0xc8Cd7f525469e62430a1833F2DdD299EDC026c88";
  const _stakeToken = "0x62dD0864C5B85A97045BC841764f449Cdb8ac6bB";
  const _reflectionsDistributor = "0x62dD0864C5B85A97045BC841764f449Cdb8ac6bB"; //fake

  const StakingTreasury = await ethers.getContractFactory("StakingTreasury");
  const stakingTreasury = await StakingTreasury.deploy(_stakingVault, _stakeToken, _reflectionsDistributor);

  await stakingTreasury.deployed();

  console.log("StakingTreasury deployed to:", stakingTreasury.address);

  const _stakingVaultWithLockTIme = "0xc8Cd7f525469e62430a1833F2DdD299EDC026c88"; // GooseBumpsStakingWithFixedLockTimeAndReflection
  const stakingTreasuryWithLockTIme = await StakingTreasury.deploy(_stakingVaultWithLockTIme, _stakeToken, _reflectionsDistributor);

  await stakingTreasuryWithLockTIme.deployed();

  console.log("StakingTreasury deployed to:", stakingTreasuryWithLockTIme.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
