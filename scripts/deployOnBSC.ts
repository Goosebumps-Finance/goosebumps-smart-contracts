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

    const accountList = await ethers.getSigners();

    const deployer = accountList[0];

    // BSC mainnet
    const empireAddress = "0x293C3Ee9ABaCb08BB8ceD107987F00EfD1539288" // Empire V1
    const lpBNB = "0x60c9bd6EEE0a911b987A749F0DB0F24D79bCDcf5" // EmpireV1/BNB
    const lpBUSD = "0x591dEFEccE63464759b3B606F4ec2974F0738462" // EmpireV1/BUSD
    
    // Staking
    console.log("=====================Staking=====================")
    const _stakeToken = empireAddress;
    const _rewardsToken = empireAddress;
    const _treasury = deployer.address;
    const _rewardWallet = deployer.address;
    const _rewardPerBlockTokenN = 100;
    const _rewardPerBlockTokenD = 100;
    console.log("_stakeToken: ", _stakeToken);
    console.log("_rewardsToken: ", _rewardsToken);
    console.log("_treasury: ", _treasury);
    console.log("_rewardWallet: ", _rewardWallet);
    console.log("_rewardPerBlockTokenN: ", _rewardPerBlockTokenN);
    console.log("_rewardPerBlockTokenD: ", _rewardPerBlockTokenD);
    const GoosebumpsStaking = await ethers.getContractFactory("GoosebumpsStaking");
    const goosebumpsStaking = await GoosebumpsStaking.deploy(_stakeToken, _rewardsToken, _treasury, _rewardWallet, _rewardPerBlockTokenN, _rewardPerBlockTokenD);
    await goosebumpsStaking.deployed();
    console.log("GoosebumpsStaking deployed to:", goosebumpsStaking.address);
    console.log("delay...")
    sleep(1000)
    console.log("==========================================")

    // StakingWithFixedLockTime
    console.log("=====================StakingWithFixedLockTime=====================")
    const GoosebumpsStakingWithFixedLockTime = await ethers.getContractFactory("GoosebumpsStakingWithFixedLockTime");
    const goosebumpsStakingWithFixedLockTime = await GoosebumpsStakingWithFixedLockTime.deploy(
        _stakeToken, _rewardsToken, _treasury, _rewardWallet, _rewardPerBlockTokenN, _rewardPerBlockTokenD);
    await goosebumpsStakingWithFixedLockTime.deployed();
    console.log("_stakeToken: ", _stakeToken);
    console.log("_rewardsToken: ", _rewardsToken);
    console.log("_treasury: ", _treasury);
    console.log("_rewardWallet: ", _rewardWallet);
    console.log("_rewardPerBlockTokenN: ", _rewardPerBlockTokenN);
    console.log("_rewardPerBlockTokenD: ", _rewardPerBlockTokenD);
    console.log("GoosebumpsStakingWithFixedLockTime deployed to:", goosebumpsStakingWithFixedLockTime.address);
    console.log("delay...")
    sleep(1000)
    console.log("==========================================")

    // StakingWithReflection
    console.log("=====================StakingWithReflection=====================")
    // ReflectionsDistributor for StakingWithReflection
    const ReflectionsDistributor = await ethers.getContractFactory("ReflectionsDistributor");
    const reflectionsDistributorWithReflections = await ReflectionsDistributor.deploy(_stakeToken, _treasury);
    await reflectionsDistributorWithReflections.deployed();
    console.log("_stakeToken: ", _stakeToken)
    console.log("_treasury: ", _treasury)
    console.log("reflectionsDistributorWithReflections deployed to:", reflectionsDistributorWithReflections.address);

    // StakingTreasury for StakingWithReflection
    const _stakingVault = "0xE689ff389d394c49B2C88A84a4605aB6d9148aEa"; // GoosebumpsStakingWithReflection
    const StakingTreasury = await ethers.getContractFactory("StakingTreasury");
    const stakingTreasuryWithReflections = await StakingTreasury.deploy(_stakingVault, _stakeToken, reflectionsDistributorWithReflections.address);
    await stakingTreasuryWithReflections.deployed();
    console.log("_stakingVault: ", _stakingVault)
    console.log("_stakeToken: ", _stakeToken)
    console.log("_reflectionsDistributor: ", reflectionsDistributorWithReflections.address)
    console.log("stakingTreasuryWithReflections deployed to:", stakingTreasuryWithReflections.address);

    // StakingWithReflection
    console.log("_stakeToken: ", _stakeToken)
    console.log("_rewardsToken: ", _rewardsToken)
    console.log("_treasury: ", stakingTreasuryWithReflections.address)
    console.log("_rewardWallet: ", _rewardWallet)
    console.log("_rewardPerBlockTokenN: ", _rewardPerBlockTokenN)
    console.log("_rewardPerBlockTokenD: ", _rewardPerBlockTokenD)
    const GoosebumpsStakingWithReflection = await ethers.getContractFactory("GoosebumpsStakingWithReflection");
    const goosebumpsStakingWithReflection = await GoosebumpsStakingWithReflection.deploy(
        _stakeToken, _rewardsToken, stakingTreasuryWithReflections.address, _rewardWallet, _rewardPerBlockTokenN, _rewardPerBlockTokenD);
    await goosebumpsStakingWithReflection.deployed();
    console.log("GoosebumpsStakingWithReflection deployed to:", goosebumpsStakingWithReflection.address);

    // Set params
    const txSetTreasury = await reflectionsDistributorWithReflections.setTreasury(stakingTreasuryWithReflections.address)
    const retTxSetTreasury = await txSetTreasury.wait()
    console.log("setTreasury txHash: ", retTxSetTreasury.transactionHash)

    const txSetStakingVault = await stakingTreasuryWithReflections.setStakingVault(goosebumpsStakingWithReflection.address)
    const retTxSetStakingVault = await txSetStakingVault.wait()
    console.log("setStakingVault txHash: ", retTxSetStakingVault.transactionHash)
    console.log("delay...")
    sleep(1000)
    console.log("==========================================")

    // StakingWithFixedLockTimeAndReflection
    console.log("=====================StakingWithFixedLockTimeAndReflection=====================")
    // ReflectionsDistributor for StakingWithFixedLockTimeAndReflection
    const reflectionsDistributorWithFixedLockTimeAndReflection = await ReflectionsDistributor.deploy(_stakeToken, _treasury);
    await reflectionsDistributorWithFixedLockTimeAndReflection.deployed();
    console.log("_stakeToken: ", _stakeToken)
    console.log("_treasury: ", _treasury)
    console.log("reflectionsDistributorWithFixedLockTimeAndReflection deployed to:", reflectionsDistributorWithFixedLockTimeAndReflection.address);

    // StakingTreasury for StakingWithFixedLockTimeAndReflection
    const stakingTreasuryWithFixedLockTimeAndReflection = await StakingTreasury.deploy(_stakingVault, _stakeToken, reflectionsDistributorWithFixedLockTimeAndReflection.address);
    await stakingTreasuryWithFixedLockTimeAndReflection.deployed();
    console.log("_stakingVault: ", _stakingVault)
    console.log("_stakeToken: ", _stakeToken)
    console.log("_reflectionsDistributor: ", reflectionsDistributorWithFixedLockTimeAndReflection.address)
    console.log("stakingTreasuryWithFixedLockTimeAndReflection deployed to:", stakingTreasuryWithFixedLockTimeAndReflection.address);

    // StakingWithFixedLockTimeAndReflection
    console.log("_stakeToken: ", _stakeToken)
    console.log("_rewardsToken: ", _rewardsToken)
    console.log("_treasury: ", stakingTreasuryWithFixedLockTimeAndReflection.address)
    console.log("_rewardWallet: ", _rewardWallet)
    console.log("_rewardPerBlockTokenN: ", _rewardPerBlockTokenN)
    console.log("_rewardPerBlockTokenD: ", _rewardPerBlockTokenD)
    const GoosebumpsStakingWithFixedLockTimeAndReflection = await ethers.getContractFactory("GoosebumpsStakingWithFixedLockTimeAndReflection");
    const goosebumpsStakingWithFixedLockTimeAndReflection = await GoosebumpsStakingWithFixedLockTimeAndReflection.deploy(
        _stakeToken, _rewardsToken, stakingTreasuryWithFixedLockTimeAndReflection.address, _rewardWallet, _rewardPerBlockTokenN, _rewardPerBlockTokenD);
    await goosebumpsStakingWithFixedLockTimeAndReflection.deployed();
    console.log("goosebumpsStakingWithFixedLockTimeAndReflection deployed to:", goosebumpsStakingWithFixedLockTimeAndReflection.address);

    // Set params
    const txSetTreasuryWithLock = await reflectionsDistributorWithFixedLockTimeAndReflection.setTreasury(stakingTreasuryWithFixedLockTimeAndReflection.address)
    const retTxSetTreasuryWithLock = await txSetTreasuryWithLock.wait()
    console.log("setTreasury txHash: ", retTxSetTreasuryWithLock.transactionHash)

    const txSetStakingVaultWithLock = await stakingTreasuryWithFixedLockTimeAndReflection.setStakingVault(goosebumpsStakingWithFixedLockTimeAndReflection.address)
    const retTxSetStakingVaultWithLock = await txSetStakingVaultWithLock.wait()
    console.log("setStakingVault txHash: ", retTxSetStakingVaultWithLock.transactionHash)
    console.log("delay...")
    sleep(1000)
    console.log("==========================================")

    // Farming
    console.log("=====================Farming=====================")
    const _lpBNB = lpBNB
    const _frewardsToken = empireAddress;

    const GoosebumpsFarming = await ethers.getContractFactory("GoosebumpsFarming");
    const goosebumpsFarming = await GoosebumpsFarming.deploy(_lpBNB, _frewardsToken, _treasury, _rewardWallet, _rewardPerBlockTokenN, _rewardPerBlockTokenD);
    await goosebumpsFarming.deployed();
    console.log("_lpToken: ", _lpBNB)
    console.log("_rewardsToken: ", _frewardsToken)
    console.log("_treasury: ", _treasury)
    console.log("_rewardWallet: ", _rewardWallet)
    console.log("_rewardPerBlockTokenN: ", _rewardPerBlockTokenN)
    console.log("_rewardPerBlockTokenD: ", _rewardPerBlockTokenD)
    console.log("goosebumpsFarming deployed to:", goosebumpsFarming.address);
    console.log("delay...")
    sleep(1000)
    console.log("==========================================")

    // Farming(Empire/BUSD)
    console.log("=====================Farming(Empire/BUSD)=====================")
    const _lpBUSD = lpBUSD
    const goosebumpsFarmingBUSD = await GoosebumpsFarming.deploy(_lpBUSD, _frewardsToken, _treasury, _rewardWallet, _rewardPerBlockTokenN, _rewardPerBlockTokenD);
    await goosebumpsFarmingBUSD.deployed();
    console.log("_lpToken: ", _lpBUSD)
    console.log("_rewardsToken: ", _frewardsToken)
    console.log("_treasury: ", _treasury)
    console.log("_rewardWallet: ", _rewardWallet)
    console.log("_rewardPerBlockTokenN: ", _rewardPerBlockTokenN)
    console.log("_rewardPerBlockTokenD: ", _rewardPerBlockTokenD)
    console.log("goosebumpsFarmingBUSD deployed to:", goosebumpsFarmingBUSD.address);
    console.log("delay...")
    sleep(1000)
    console.log("==========================================")

    // FarmingWithFixedLockTime
    console.log("=====================FarmingWithFixedLockTime=====================")
    const GoosebumpsFarmingWithFixedLockTime = await ethers.getContractFactory("GoosebumpsFarmingWithFixedLockTime");
    const goosebumpsFarmingWithFixedLockTime = await GoosebumpsFarmingWithFixedLockTime.deploy(_lpBNB, _frewardsToken, _treasury, _rewardWallet, _rewardPerBlockTokenN, _rewardPerBlockTokenD);
    await goosebumpsFarmingWithFixedLockTime.deployed();
    console.log("_lpToken: ", _lpBNB)
    console.log("_rewardsToken: ", _frewardsToken)
    console.log("_treasury: ", _treasury)
    console.log("_rewardWallet: ", _rewardWallet)
    console.log("_rewardPerBlockTokenN: ", _rewardPerBlockTokenN)
    console.log("_rewardPerBlockTokenD: ", _rewardPerBlockTokenD)
    console.log("goosebumpsFarmingWithFixedLockTime deployed to:", goosebumpsFarmingWithFixedLockTime.address);
    console.log("delay...")
    sleep(1000)
    console.log("==========================================")

    // FarmingWithFixedLockTime(Empire/BUSD)
    console.log("=====================FarmingWithFixedLockTime(Empire/BUSD)=====================")
    const goosebumpsFarmingWithFixedLockTimeBUSD = await GoosebumpsFarmingWithFixedLockTime.deploy(_lpBUSD, _frewardsToken, _treasury, _rewardWallet, _rewardPerBlockTokenN, _rewardPerBlockTokenD);
    await goosebumpsFarmingWithFixedLockTimeBUSD.deployed();
    console.log("_lpToken: ", _lpBUSD)
    console.log("_rewardsToken: ", _frewardsToken)
    console.log("_treasury: ", _treasury)
    console.log("_rewardWallet: ", _rewardWallet)
    console.log("_rewardPerBlockTokenN: ", _rewardPerBlockTokenN)
    console.log("_rewardPerBlockTokenD: ", _rewardPerBlockTokenD)
    console.log("goosebumpsFarmingWithFixedLockTimeBUSD deployed to:", goosebumpsFarmingWithFixedLockTimeBUSD.address);
    console.log("delay...")
    sleep(1000)
    console.log("==========================================")
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
