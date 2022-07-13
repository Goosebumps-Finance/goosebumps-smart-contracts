import { expect } from "chai";
import hre, { ethers } from "hardhat";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { Contract } from "ethers";

let accountList: SignerWithAddress[];
let goosebumpsStakingWithFixedLockTime: Contract;
let stakeToken: Contract;
let rewardToken: Contract;
let ownerAccounts: SignerWithAddress;
let general_user: SignerWithAddress;
let staker1: SignerWithAddress;
let staker2: SignerWithAddress;

before(async function () {
    await hre.network.provider.send("hardhat_reset");

    await hre.network.provider.request(
        {
            method: "hardhat_reset",
            params: []
        }
    );

    accountList = await ethers.getSigners();

    ownerAccounts = accountList[0];
    general_user = accountList[1];

    let name_ = "Roburna Stake Token"
    let symbol_ = "Stake Token"

    const Token = await ethers.getContractFactory("Token");
    stakeToken = await Token.connect(ownerAccounts).deploy(name_, symbol_);

    await stakeToken.deployed();

    console.log("stakeToken deployed to:", stakeToken.address);

    const _stakeToken = stakeToken.address;

    name_ = "Roburna Reward Token"
    symbol_ = "Reward Token"

    rewardToken = await Token.connect(ownerAccounts).deploy(name_, symbol_);

    console.log("rewardToken deployed to:", rewardToken.address);

    const _rewardsToken = rewardToken.address;
    const _treasury = await stakeToken.owner();
    console.log("Treasury: ", _treasury);
    const _rewardWallet = await rewardToken.owner();
    console.log("Reward Wallet: ", _rewardWallet);
    const _rewardPerBlockTokenN = 100;
    const _rewardPerBlockTokenD = 100;

    const GoosebumpsStakingWithFixedLockTime = await ethers.getContractFactory("GoosebumpsStakingWithFixedLockTime");
    goosebumpsStakingWithFixedLockTime = await GoosebumpsStakingWithFixedLockTime.connect(ownerAccounts).deploy(_stakeToken, _rewardsToken, _treasury, _rewardWallet, _rewardPerBlockTokenN, _rewardPerBlockTokenD);

    await goosebumpsStakingWithFixedLockTime.deployed();

    console.log("GoosebumpsStakingWithFixedLockTime deployed to:", goosebumpsStakingWithFixedLockTime.address);

    for (let i = 1; i < accountList.length; i++) {
        await expect(stakeToken.connect(ownerAccounts).transfer(accountList[i].address, ethers.utils.parseEther("10000")))
            .to.emit(stakeToken, "Transfer").withArgs(ownerAccounts.address, accountList[i].address, ethers.utils.parseEther("10000"));
        console.log("Token balance of %s is %s Stake Token", accountList[i].address, ethers.utils.formatEther(await stakeToken.balanceOf(accountList[i].address)))
        console.log("ETH balance of %s is %s ETH", accountList[i].address, parseFloat(ethers.utils.formatEther(await ethers.provider.getBalance(accountList[i].address))))
    }

    let approveTx = await stakeToken.connect(ownerAccounts).approve(goosebumpsStakingWithFixedLockTime.address, ethers.utils.parseEther("100000000000000000000"));
    await approveTx.wait();

    approveTx = await rewardToken.connect(ownerAccounts).approve(goosebumpsStakingWithFixedLockTime.address, ethers.utils.parseEther("100000000000000000000"));
    await approveTx.wait();

    staker1 = accountList[5];
    staker2 = accountList[6];

    const setRewardWalletTx = await goosebumpsStakingWithFixedLockTime.connect(ownerAccounts).setLockTime(1);
    await setRewardWalletTx.wait();

    expect(await goosebumpsStakingWithFixedLockTime.connect(ownerAccounts).lockTime()).to.equal(1);

    // console.log(accountList.length)
    // for (let i = 0; i < accountList.length; i++)
    //     console.log("## ", accountList[i].address);
});

describe("GoosebumpsStakingWithFixedLockTime Test", function () {

    describe("stake Test", function () {
        it("stake Success and emit LogStake", async function () {
            const approveTx = await stakeToken.connect(general_user).approve(goosebumpsStakingWithFixedLockTime.address, ethers.utils.parseEther("100"));
            await approveTx.wait();

            await expect(goosebumpsStakingWithFixedLockTime.connect(general_user).stake(ethers.utils.parseEther("100")))
                .to.be.emit(goosebumpsStakingWithFixedLockTime, "LogStake").withArgs(general_user.address, ethers.utils.parseEther("100"));
        });
    });

    describe("withdrawRewards Test", function () {
        it("withdrawRewards Success and emit LogRewardsWithdrawal", async function () {
            await expect(goosebumpsStakingWithFixedLockTime.connect(general_user).withdrawRewards())
                .to.be.emit(goosebumpsStakingWithFixedLockTime, "LogRewardsWithdrawal");
        });
    });

    describe("unstake Test", function () {
        it("unstake Success and emit LogUnstake", async function () {
            await expect(goosebumpsStakingWithFixedLockTime.connect(general_user).unstake(ethers.utils.parseEther("100")))
                .to.be.emit(goosebumpsStakingWithFixedLockTime, "LogUnstake");
        });
    });

    describe("stake and unstake and withdrawRewards fail because contract is paused", function () {
        before(async function () {
            const setPauseTx = await goosebumpsStakingWithFixedLockTime.connect(ownerAccounts).setPause();
            // wait until the transaction is mined
            await setPauseTx.wait();
        });

        it("stake fail because contract is paused", async function () {
            const approveTx = await stakeToken.connect(general_user).approve(goosebumpsStakingWithFixedLockTime.address, ethers.utils.parseEther("100"));
            await approveTx.wait();

            await expect(goosebumpsStakingWithFixedLockTime.connect(general_user).stake(ethers.utils.parseEther("100")))
                .to.revertedWith('Pausable: paused');
        });

        it("unstake fail because contract is paused", async function () {
            await expect(goosebumpsStakingWithFixedLockTime.connect(general_user).unstake(ethers.utils.parseEther("100")))
                .to.revertedWith('Pausable: paused');
        });

        it("withdrawRewards fail because contract is paused", async function () {
            await expect(goosebumpsStakingWithFixedLockTime.connect(general_user).withdrawRewards())
                .to.revertedWith('Pausable: paused');
        });

        after(async function () {
            const setUnpauseTx = await goosebumpsStakingWithFixedLockTime.connect(ownerAccounts).setUnpause();

            await setUnpauseTx.wait();
        });
    });

    describe("stake and unstake and withdrawRewards fail with reverted string", function () {
        it("stake fail because not approved", async function () {
            let approveTx = await stakeToken.connect(general_user).approve(goosebumpsStakingWithFixedLockTime.address, ethers.utils.parseEther("0"));
            await approveTx.wait();
            await expect(goosebumpsStakingWithFixedLockTime.connect(general_user).stake(ethers.utils.parseEther("100")))
                .to.revertedWith('ERC20: insufficient allowance');
        });

        it("stake fail because staking amount is zero", async function () {
            await expect(goosebumpsStakingWithFixedLockTime.connect(general_user).stake(0))
                .to.revertedWith('Staking amount must be greater than zero');
        });

        it("stake fail because 'Insufficient stakeToken balance'", async function () {
            await expect(goosebumpsStakingWithFixedLockTime.connect(general_user).stake(ethers.utils.parseEther("100000")))
                .to.revertedWith('Insufficient stakeToken balance');
        });

        it("unstake fail because not approved", async function () {
            let approveTx = await stakeToken.connect(general_user).approve(goosebumpsStakingWithFixedLockTime.address, ethers.utils.parseEther("100"));
            await approveTx.wait();

            await expect(goosebumpsStakingWithFixedLockTime.connect(general_user).stake(ethers.utils.parseEther("100")))
                .to.be.emit(goosebumpsStakingWithFixedLockTime, "LogStake").withArgs(general_user.address, ethers.utils.parseEther("100"));

            approveTx = await stakeToken.connect(ownerAccounts).approve(goosebumpsStakingWithFixedLockTime.address, ethers.utils.parseEther("0"));
            await approveTx.wait();
            await expect(goosebumpsStakingWithFixedLockTime.connect(general_user).unstake(ethers.utils.parseEther("100")))
                .to.revertedWith('ERC20: insufficient allowance');

            approveTx = await stakeToken.connect(ownerAccounts).approve(goosebumpsStakingWithFixedLockTime.address, ethers.utils.parseEther("100000000000000000000"));
            await approveTx.wait();
        });

        it("unstake fail because unstaking amount is zero", async function () {
            await expect(goosebumpsStakingWithFixedLockTime.connect(general_user).unstake(0))
                .to.revertedWith('Unstaking amount must be greater than zero');
        });

        it("unstake fail because 'Insufficient unstake'", async function () {
            await expect(goosebumpsStakingWithFixedLockTime.connect(general_user).unstake(ethers.utils.parseEther("1000")))
                .to.revertedWith('Insufficient unstake');
        });

        it("unstake fail because reward wallet not approved", async function () {
            let approveTx = await rewardToken.connect(ownerAccounts).approve(goosebumpsStakingWithFixedLockTime.address, ethers.utils.parseEther("0"));
            await approveTx.wait();

            await expect(goosebumpsStakingWithFixedLockTime.connect(general_user).unstake(ethers.utils.parseEther("10")))
                .to.revertedWith('ERC20: insufficient allowance');
        });

        it("withdrawRewards fail because reward wallet not approved", async function () {
            await expect(goosebumpsStakingWithFixedLockTime.connect(general_user).withdrawRewards())
                .to.revertedWith('ERC20: insufficient allowance');

            let approveTx = await rewardToken.connect(ownerAccounts).approve(goosebumpsStakingWithFixedLockTime.address, ethers.utils.parseEther("100000000000000000000"));
            await approveTx.wait();
        });

        it("unstake fail because 'Can't unstake yet'", async function () {
            let approveTx = await stakeToken.connect(general_user).approve(goosebumpsStakingWithFixedLockTime.address, ethers.utils.parseEther("100"));
            await approveTx.wait();

            let setLockTime = await goosebumpsStakingWithFixedLockTime.connect(ownerAccounts).setLockTime(10000000);
            await setLockTime.wait();

            expect(await goosebumpsStakingWithFixedLockTime.connect(ownerAccounts).lockTime()).to.equal(10000000);

            await expect(goosebumpsStakingWithFixedLockTime.connect(general_user).stake(ethers.utils.parseEther("20")))
                .to.be.emit(goosebumpsStakingWithFixedLockTime, "LogStake").withArgs(general_user.address, ethers.utils.parseEther("20"));

            await expect(goosebumpsStakingWithFixedLockTime.connect(general_user).unstake(ethers.utils.parseEther("10")))
                .to.revertedWith('Can\'t unstake yet');

            setLockTime = await goosebumpsStakingWithFixedLockTime.connect(ownerAccounts).setLockTime(1);
            await setLockTime.wait();

            expect(await goosebumpsStakingWithFixedLockTime.connect(ownerAccounts).lockTime()).to.equal(1);
        });
    });

    describe("stake and unstake and withdrawRewards success with mutilcase", function () {
        before(async function () {
            let approveTx = await stakeToken.connect(staker1).approve(goosebumpsStakingWithFixedLockTime.address, ethers.utils.parseEther("10000"));
            await approveTx.wait();

            approveTx = await stakeToken.connect(staker2).approve(goosebumpsStakingWithFixedLockTime.address, ethers.utils.parseEther("10000"));
            await approveTx.wait();

            let setLockTime = await goosebumpsStakingWithFixedLockTime.connect(ownerAccounts).setLockTime(0);
            await setLockTime.wait();
        });

        describe("multi-stake and multi-unstake and multi-withdrawRewards success", function () {
            it("stake and stake success with another stakers", async function () {
                await expect(goosebumpsStakingWithFixedLockTime.connect(staker1).stake(ethers.utils.parseEther("100")))
                    .to.be.emit(goosebumpsStakingWithFixedLockTime, "LogStake").withArgs(staker1.address, ethers.utils.parseEther("100"));

                await expect(goosebumpsStakingWithFixedLockTime.connect(staker1).stake(ethers.utils.parseEther("100")))
                    .to.be.emit(goosebumpsStakingWithFixedLockTime, "LogStake").withArgs(staker1.address, ethers.utils.parseEther("100"));

                await expect(goosebumpsStakingWithFixedLockTime.connect(staker2).stake(ethers.utils.parseEther("100")))
                    .to.be.emit(goosebumpsStakingWithFixedLockTime, "LogStake").withArgs(staker2.address, ethers.utils.parseEther("100"));

                await expect(goosebumpsStakingWithFixedLockTime.connect(staker2).stake(ethers.utils.parseEther("100")))
                    .to.be.emit(goosebumpsStakingWithFixedLockTime, "LogStake").withArgs(staker2.address, ethers.utils.parseEther("100"));

                await expect(goosebumpsStakingWithFixedLockTime.connect(staker1).stake(ethers.utils.parseEther("100")))
                    .to.be.emit(goosebumpsStakingWithFixedLockTime, "LogStake").withArgs(staker1.address, ethers.utils.parseEther("100"));
            });

            it("unstake and unstake success with another stakers", async function () {
                await expect(goosebumpsStakingWithFixedLockTime.connect(staker1).unstake(ethers.utils.parseEther("20")))
                    .to.be.emit(goosebumpsStakingWithFixedLockTime, "LogUnstake");

                await expect(goosebumpsStakingWithFixedLockTime.connect(staker1).unstake(ethers.utils.parseEther("20")))
                    .to.be.emit(goosebumpsStakingWithFixedLockTime, "LogUnstake");

                await expect(goosebumpsStakingWithFixedLockTime.connect(staker2).unstake(ethers.utils.parseEther("20")))
                    .to.be.emit(goosebumpsStakingWithFixedLockTime, "LogUnstake");

                await expect(goosebumpsStakingWithFixedLockTime.connect(staker2).unstake(ethers.utils.parseEther("20")))
                    .to.be.emit(goosebumpsStakingWithFixedLockTime, "LogUnstake");

                await expect(goosebumpsStakingWithFixedLockTime.connect(staker1).unstake(ethers.utils.parseEther("20")))
                    .to.be.emit(goosebumpsStakingWithFixedLockTime, "LogUnstake");
            });

            it("withdrawRewards and withdrawRewards success with another stakers", async function () {
                await expect(goosebumpsStakingWithFixedLockTime.connect(staker1).withdrawRewards())
                    .to.be.emit(goosebumpsStakingWithFixedLockTime, "LogRewardsWithdrawal");

                await expect(goosebumpsStakingWithFixedLockTime.connect(staker1).withdrawRewards())
                    .to.be.emit(goosebumpsStakingWithFixedLockTime, "LogRewardsWithdrawal");

                await expect(goosebumpsStakingWithFixedLockTime.connect(staker2).withdrawRewards())
                    .to.be.emit(goosebumpsStakingWithFixedLockTime, "LogRewardsWithdrawal");

                await expect(goosebumpsStakingWithFixedLockTime.connect(staker2).withdrawRewards())
                    .to.be.emit(goosebumpsStakingWithFixedLockTime, "LogRewardsWithdrawal");

                await expect(goosebumpsStakingWithFixedLockTime.connect(staker1).withdrawRewards())
                    .to.be.emit(goosebumpsStakingWithFixedLockTime, "LogRewardsWithdrawal");
            });
        });

        describe("multi-stake-unstake-withdrawRewards success", function () {
            it("stake-unstake-withdrawRewards success with another stakers", async function () {
                await expect(goosebumpsStakingWithFixedLockTime.connect(staker1).stake(ethers.utils.parseEther("100")))
                    .to.be.emit(goosebumpsStakingWithFixedLockTime, "LogStake").withArgs(staker1.address, ethers.utils.parseEther("100"));

                await expect(goosebumpsStakingWithFixedLockTime.connect(staker2).unstake(ethers.utils.parseEther("20")))
                    .to.be.emit(goosebumpsStakingWithFixedLockTime, "LogUnstake");

                await expect(goosebumpsStakingWithFixedLockTime.connect(staker1).withdrawRewards())
                    .to.be.emit(goosebumpsStakingWithFixedLockTime, "LogRewardsWithdrawal");

                await expect(goosebumpsStakingWithFixedLockTime.connect(staker2).withdrawRewards())
                    .to.be.emit(goosebumpsStakingWithFixedLockTime, "LogRewardsWithdrawal");

                await expect(goosebumpsStakingWithFixedLockTime.connect(staker1).unstake(ethers.utils.parseEther("20")))
                    .to.be.emit(goosebumpsStakingWithFixedLockTime, "LogUnstake");

                await expect(goosebumpsStakingWithFixedLockTime.connect(staker2).stake(ethers.utils.parseEther("20")))
                    .to.be.emit(goosebumpsStakingWithFixedLockTime, "LogStake").withArgs(staker2.address, ethers.utils.parseEther("20"));

                await expect(goosebumpsStakingWithFixedLockTime.connect(staker1).withdrawRewards())
                    .to.be.emit(goosebumpsStakingWithFixedLockTime, "LogRewardsWithdrawal");

                await expect(goosebumpsStakingWithFixedLockTime.connect(staker2).stake(ethers.utils.parseEther("20")))
                    .to.be.emit(goosebumpsStakingWithFixedLockTime, "LogStake").withArgs(staker2.address, ethers.utils.parseEther("20"));
            });
        });
    });

    describe("setTreasury Test", function () {
        it("Set success", async function () {
            const setTreasuryTx = await goosebumpsStakingWithFixedLockTime.connect(ownerAccounts).setTreasury(general_user.address);

            // wait until the transaction is mined
            await setTreasuryTx.wait();

            expect(await goosebumpsStakingWithFixedLockTime.connect(ownerAccounts).TREASURY()).to.equal(general_user.address);
        });

        it("Set fail because setter is not owner", async function () {
            await expect(goosebumpsStakingWithFixedLockTime.connect(general_user).setTreasury(ownerAccounts.address)).to.revertedWith('Ownable: caller is not the owner');
        });

        it("Set success and emit LogSetTreasury", async function () {
            await expect(goosebumpsStakingWithFixedLockTime.connect(ownerAccounts).setTreasury(ownerAccounts.address))
                .to.emit(goosebumpsStakingWithFixedLockTime, "LogSetTreasury").withArgs(ownerAccounts.address);

            expect(await goosebumpsStakingWithFixedLockTime.connect(general_user).TREASURY()).to.equal(ownerAccounts.address);
        });
    });

    describe("setRewardWallet Test", function () {
        it("Set success", async function () {
            const setRewardWalletTx = await goosebumpsStakingWithFixedLockTime.connect(ownerAccounts).setRewardWallet(accountList[2].address);

            // wait until the transaction is mined
            await setRewardWalletTx.wait();

            expect(await goosebumpsStakingWithFixedLockTime.connect(ownerAccounts).REWARD_WALLET()).to.equal(accountList[2].address);
        });

        it("Set fail because setter is not owner", async function () {
            await expect(goosebumpsStakingWithFixedLockTime.connect(general_user).setRewardWallet(ownerAccounts.address)).to.revertedWith('Ownable: caller is not the owner');
        });

        it("Set success and emit LogSetRewardWallet", async function () {
            await expect(goosebumpsStakingWithFixedLockTime.connect(ownerAccounts).setRewardWallet(ownerAccounts.address))
                .to.emit(goosebumpsStakingWithFixedLockTime, "LogSetRewardWallet").withArgs(ownerAccounts.address);

            expect(await goosebumpsStakingWithFixedLockTime.connect(general_user).TREASURY()).to.equal(ownerAccounts.address);
        });
    });

    describe("setLockTime Test", function () {
        it("Set success", async function () {
            const setRewardWalletTx = await goosebumpsStakingWithFixedLockTime.connect(ownerAccounts).setLockTime(10);
            await setRewardWalletTx.wait();

            expect(await goosebumpsStakingWithFixedLockTime.connect(ownerAccounts).lockTime()).to.equal(10);
        });

        it("Set fail because setter is not owner", async function () {
            await expect(goosebumpsStakingWithFixedLockTime.connect(general_user).setLockTime(10)).to.revertedWith('Ownable: caller is not the owner');
        });

        it("Set success and emit LogSetLockTime", async function () {
            await expect(goosebumpsStakingWithFixedLockTime.connect(ownerAccounts).setLockTime(20))
                .to.emit(goosebumpsStakingWithFixedLockTime, "LogSetLockTime").withArgs(20);

            expect(await goosebumpsStakingWithFixedLockTime.connect(general_user).lockTime()).to.equal(20);
        });
    });

    describe("setPause and setUnpause Test", function () {
        it("setPause success", async function () {
            const setPauseTx = await goosebumpsStakingWithFixedLockTime.connect(ownerAccounts).setPause();

            // wait until the transaction is mined
            await setPauseTx.wait();

            expect(await goosebumpsStakingWithFixedLockTime.connect(ownerAccounts).paused()).to.equal(true);
        });

        it("setPause fail because already paused", async function () {
            await expect(goosebumpsStakingWithFixedLockTime.connect(ownerAccounts).setPause()).to.revertedWith('Pausable: paused');
        });

        it("setUnpause success", async function () {
            const setUnpauseTx = await goosebumpsStakingWithFixedLockTime.connect(ownerAccounts).setUnpause();

            await setUnpauseTx.wait();

            expect(await goosebumpsStakingWithFixedLockTime.connect(ownerAccounts).paused()).to.equal(false);
        });

        it("setUnpause fail because already unpaused", async function () {
            await expect(goosebumpsStakingWithFixedLockTime.connect(ownerAccounts).setUnpause()).to.revertedWith('Pausable: not paused');
        });

        it("setPause fail because setter is not owner", async function () {
            await expect(goosebumpsStakingWithFixedLockTime.connect(general_user).setPause()).to.revertedWith('Ownable: caller is not the owner');
        });

        it("setUnpause fail because setter is not owner", async function () {
            await expect(goosebumpsStakingWithFixedLockTime.connect(general_user).setUnpause()).to.revertedWith('Ownable: caller is not the owner');
        });

        it("setPause success and emit Paused", async function () {
            await expect(goosebumpsStakingWithFixedLockTime.connect(ownerAccounts).setPause())
                .to.emit(goosebumpsStakingWithFixedLockTime, "Paused").withArgs(ownerAccounts.address);

            expect(await goosebumpsStakingWithFixedLockTime.connect(general_user).paused()).to.equal(true);
        });

        it("setUnpause success and emit Unpaused", async function () {
            await expect(goosebumpsStakingWithFixedLockTime.connect(ownerAccounts).setUnpause())
                .to.emit(goosebumpsStakingWithFixedLockTime, "Unpaused").withArgs(ownerAccounts.address);

            expect(await goosebumpsStakingWithFixedLockTime.connect(general_user).paused()).to.equal(false);
        });
    });
});
