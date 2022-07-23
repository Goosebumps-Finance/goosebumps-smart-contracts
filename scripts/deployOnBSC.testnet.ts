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

    // BSC testnet

    // Main MockEmpire token
    console.log("=====================MockEmpire=====================")
    const _router = "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3";
    const _marketingWallet = accountList[1].address;
    const _teamWallet = accountList[2].address;
    const _liquidityWallet = accountList[3].address;
    const sTokenName_ = "Mock Empire"
    const sTokenSymbol_ = "MockEMPIRE"
    console.log("_router: ", _router)
    console.log("_marketingWallet: ", _marketingWallet)
    console.log("_teamWallet: ", _teamWallet)
    console.log("_liquidityWallet: ", _liquidityWallet)
    console.log("sTokenName_: ", sTokenName_)
    console.log("sTokenSymbol_: ", sTokenSymbol_)
    const Empire = await ethers.getContractFactory("MockEmpire");
    const empire = await Empire.deploy(_router, _marketingWallet, _teamWallet, _liquidityWallet, sTokenName_, sTokenSymbol_);
    await empire.deployed();
    console.log("MockEmpire deployed to:", empire.address);
    console.log("delay...")
    sleep(1000)
    console.log("==========================================")

    // Approve MockEmpire to router
    console.log("=====================MockEmpire Approve=====================")
    const txApprove = await empire.approve(_router, ethers.utils.parseUnits("100000000", 9));
    const retTxApprove = await txApprove.wait();
    console.log("MockEmpire Approve txHash: ", retTxApprove.transactionHash);
    console.log("delay...")
    sleep(1000)
    console.log("==========================================")

    // Mock BUSD token
    console.log("=====================Mock BUSD=====================")
    const BusdName_ = "MockBUSD"
    const BusdSymbol_ = "MockBUSD"
    console.log("BusdName_: ", BusdName_)
    console.log("BusdSymbol_: ", BusdSymbol_)
    const MockToken = await ethers.getContractFactory("MockToken");
    const busdToken = await MockToken.deploy(BusdName_, BusdSymbol_);
    await busdToken.deployed();
    console.log("busdToken deployed to:", busdToken.address);
    console.log("delay...")
    sleep(1000)
    console.log("==========================================")

    // Appove MockBUSD to router
    console.log("=====================Mock BUSD Appove=====================")
    const txMockBUSDApprove = await busdToken.approve(_router, ethers.utils.parseUnits("100000000", 18));
    const retTxMockBUSDApprove = await txMockBUSDApprove.wait();
    console.log("MockBUSD Approve txHash: ", retTxMockBUSDApprove.transactionHash);
    console.log("delay...")
    sleep(1000)
    console.log("==========================================")

    // AddLiquidityETH (MockEmpire/BNB)
    console.log("=====================AddLiquidityETH (MockEmpire/BNB)=====================")
    const _routerABI =
        [
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "tokenA",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "tokenB",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "amountADesired",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "amountBDesired",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "amountAMin",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "amountBMin",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "deadline",
                        "type": "uint256"
                    }
                ],
                "name": "addLiquidity",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "amountA",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "amountB",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "liquidity",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "token",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "amountTokenDesired",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "amountTokenMin",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "amountETHMin",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "deadline",
                        "type": "uint256"
                    }
                ],
                "name": "addLiquidityETH",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "amountToken",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "amountETH",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "liquidity",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "payable",
                "type": "function"
            },
        ]

    const router = new ethers.Contract(_router, _routerABI, deployer);

    const provider = new ethers.providers.JsonRpcProvider("https://data-seed-prebsc-2-s3.binance.org:8545/")
    const timeStamp = (await provider.getBlock("pending")).timestamp
    console.log("timeStamp: ", timeStamp)
    const txAddLiquidityETH = await router.addLiquidityETH(
        empire.address,
        ethers.utils.parseUnits("1000000", 9), 0, 0,
        deployer.address,
        timeStamp + 1000,
        { value: ethers.utils.parseEther("0.05") }
    );
    const retTxAddLiquidityETH = await txAddLiquidityETH.wait();
    console.log("AddLiquidityETH txHash: ", retTxAddLiquidityETH.transactionHash)
    console.log("delay...")
    sleep(1000)
    console.log("==========================================")

    // AddLiquidity (MockEmpire/MockBUSD)
    console.log("=====================AddLiquidity (MockEmpire/MockBUSD)=====================")
    const txAddLiquidity = await router.addLiquidity(
        empire.address,
        busdToken.address,
        ethers.utils.parseUnits("1000000", 9),
        ethers.utils.parseUnits("5000", 18), 0, 0,
        deployer.address,
        timeStamp + 1000,
    );
    const retTxAddLiquidity = await txAddLiquidity.wait();
    console.log("AddLiquidity txHash: ", retTxAddLiquidity.transactionHash)
    console.log("delay...")
    sleep(1000)
    console.log("==========================================")

    // Staking Reward token
    console.log("=====================Staking Reward token=====================")
    const sRewardName_ = "StakingReward"
    const sRewardSymbol_ = "sReward"
    console.log("sRewardName_: ", sRewardName_)
    console.log("sRewardSymbol_: ", sRewardSymbol_)
    const sRewardToken = await MockToken.deploy(sRewardName_, sRewardSymbol_);
    await sRewardToken.deployed();
    console.log("sRewardToken deployed to:", sRewardToken.address);
    console.log("delay...")
    sleep(1000)
    console.log("==========================================")

    // Farming Reward token
    console.log("=====================Farming Reward token=====================")
    const fRewardName_ = "FarmingReward"
    const fRewardSymbol_ = "fReward"
    console.log("fRewardName_: ", fRewardName_)
    console.log("fRewardSymbol_: ", fRewardSymbol_)
    const fReward = await MockToken.deploy(fRewardName_, fRewardSymbol_);
    await fReward.deployed();
    console.log("fReward deployed to:", fReward.address);
    console.log("delay...")
    sleep(1000)
    console.log("==========================================")

    // Staking
    console.log("=====================Staking=====================")
    const _stakeToken = empire.address;
    const _rewardsToken = sRewardToken.address;;
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

    // StakingWithLockTimeAndReflection
    console.log("=====================StakingWithLockTimeAndReflection=====================")
    // ReflectionsDistributor for StakingWithLockTimeAndReflection
    const reflectionsDistributorWithLockTimeAndReflection = await ReflectionsDistributor.deploy(_stakeToken, _treasury);
    await reflectionsDistributorWithLockTimeAndReflection.deployed();
    console.log("_stakeToken: ", _stakeToken)
    console.log("_treasury: ", _treasury)
    console.log("reflectionsDistributorWithLockTimeAndReflection deployed to:", reflectionsDistributorWithLockTimeAndReflection.address);

    // StakingTreasury for StakingWithLockTimeAndReflection
    const stakingTreasuryWithLockTimeAndReflection = await StakingTreasury.deploy(_stakingVault, _stakeToken, reflectionsDistributorWithLockTimeAndReflection.address);
    await stakingTreasuryWithLockTimeAndReflection.deployed();
    console.log("_stakingVault: ", _stakingVault)
    console.log("_stakeToken: ", _stakeToken)
    console.log("_reflectionsDistributor: ", reflectionsDistributorWithLockTimeAndReflection.address)
    console.log("stakingTreasuryWithLockTimeAndReflection deployed to:", stakingTreasuryWithLockTimeAndReflection.address);

    // StakingWithLockTimeAndReflection
    console.log("_stakeToken: ", _stakeToken)
    console.log("_rewardsToken: ", _rewardsToken)
    console.log("_treasury: ", stakingTreasuryWithLockTimeAndReflection.address)
    console.log("_rewardWallet: ", _rewardWallet)
    console.log("_rewardPerBlockTokenN: ", _rewardPerBlockTokenN)
    console.log("_rewardPerBlockTokenD: ", _rewardPerBlockTokenD)
    const GoosebumpsStakingWithLockTimeAndReflection = await ethers.getContractFactory("GoosebumpsStakingWithLockTimeAndReflection");
    const goosebumpsStakingWithLockTimeAndReflection = await GoosebumpsStakingWithLockTimeAndReflection.deploy(
        _stakeToken, _rewardsToken, stakingTreasuryWithLockTimeAndReflection.address, _rewardWallet, _rewardPerBlockTokenN, _rewardPerBlockTokenD);
    await goosebumpsStakingWithLockTimeAndReflection.deployed();
    console.log("goosebumpsStakingWithLockTimeAndReflection deployed to:", goosebumpsStakingWithLockTimeAndReflection.address);

    // Set params
    const txSetTreasuryWithLock = await reflectionsDistributorWithLockTimeAndReflection.setTreasury(stakingTreasuryWithLockTimeAndReflection.address)
    const retTxSetTreasuryWithLock = await txSetTreasuryWithLock.wait()
    console.log("setTreasury txHash: ", retTxSetTreasuryWithLock.transactionHash)

    const txSetStakingVaultWithLock = await stakingTreasuryWithLockTimeAndReflection.setStakingVault(goosebumpsStakingWithLockTimeAndReflection.address)
    const retTxSetStakingVaultWithLock = await txSetStakingVaultWithLock.wait()
    console.log("setStakingVault txHash: ", retTxSetStakingVaultWithLock.transactionHash)
    console.log("delay...")
    sleep(1000)
    console.log("==========================================")

    // Farming
    console.log("=====================Farming=====================")
    const WETH = "0xae13d989dac2f0debff460ac112a837c89baa7cd"
    const _factory = "0xb7926c0430afb07aa7defde6da862ae0bde767bc"
    const _factoryABI =
        [
            {
                "constant": true,
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                    }
                ],
                "name": "getPair",
                "outputs": [
                    {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                    }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
            },
        ]
    const factory = new ethers.Contract(_factory, _factoryABI, deployer);
    const _lpBNB = await factory.getPair(empire.address, WETH)
    const _frewardsToken = fReward.address;

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
    const _lpBUSD = await factory.getPair(empire.address, busdToken.address)
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
