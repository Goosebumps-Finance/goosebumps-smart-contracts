import { expect } from "chai";
import hre, { ethers } from "hardhat";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { Contract } from "ethers";

let accountList: SignerWithAddress[];
let goosebumpsStaking: Contract;
let stakeToken: Contract;
let rewardToken: Contract;
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

    let name_ = "Roburna Stake Token"
    let symbol_ = "Stake Token"

    const Token = await ethers.getContractFactory("MockToken");
    stakeToken = await Token.connect(accountList[0]).deploy(name_, symbol_);

    await stakeToken.deployed();

    console.log("stakeToken deployed to:", stakeToken.address);

    const _stakeToken = stakeToken.address;

    name_ = "Roburna Reward Token"
    symbol_ = "Reward Token"

    rewardToken = await Token.connect(accountList[0]).deploy(name_, symbol_);

    console.log("rewardToken deployed to:", rewardToken.address);

    const _rewardsToken = rewardToken.address;
    const _treasury = await stakeToken.owner();
    console.log("Treasury: ", _treasury);
    const _rewardWallet = await rewardToken.owner();
    console.log("Reward Wallet: ", _rewardWallet);
    const _rewardPerBlockTokenN = 100;
    const _rewardPerBlockTokenD = 100;

    const GoosebumpsStaking = await ethers.getContractFactory("GoosebumpsStaking");
    goosebumpsStaking = await GoosebumpsStaking.connect(accountList[0]).deploy(_stakeToken, _rewardsToken, _treasury, _rewardWallet, _rewardPerBlockTokenN, _rewardPerBlockTokenD);

    await goosebumpsStaking.deployed();

    console.log("GoosebumpsStaking deployed to:", goosebumpsStaking.address);

    for (let i = 1; i < accountList.length; i++) {
        await expect(stakeToken.connect(accountList[0]).transfer(accountList[i].address, ethers.utils.parseEther("10000")))
            .to.emit(stakeToken, "Transfer").withArgs(accountList[0].address, accountList[i].address, ethers.utils.parseEther("10000"));
        console.log("Token balance of %s is %s Stake Token", accountList[i].address, ethers.utils.formatEther(await stakeToken.balanceOf(accountList[i].address)))
        console.log("ETH balance of %s is %s ETH", accountList[i].address, parseFloat(ethers.utils.formatEther(await ethers.provider.getBalance(accountList[i].address))))
    }

    let approveTx = await stakeToken.connect(accountList[0]).approve(goosebumpsStaking.address, ethers.utils.parseEther("100000000000000000000"));
    await approveTx.wait();

    approveTx = await rewardToken.connect(accountList[0]).approve(goosebumpsStaking.address, ethers.utils.parseEther("100000000000000000000"));
    await approveTx.wait();

    staker1 = accountList[5];
    staker2 = accountList[6];

    // console.log(accountList.length)
    // for (let i = 0; i < accountList.length; i++)
    //     console.log("## ", accountList[i].address);
});

describe("GoosebumpsStaking Test", function () {

    describe("stake Test", function () {
        it("stake Success and emit LogStake", async function () {
            const approveTx = await stakeToken.connect(accountList[1]).approve(goosebumpsStaking.address, ethers.utils.parseEther("100"));
            await approveTx.wait();

            await expect(goosebumpsStaking.connect(accountList[1]).stake(ethers.utils.parseEther("100")))
                .to.be.emit(goosebumpsStaking, "LogStake").withArgs(accountList[1].address, ethers.utils.parseEther("100"));
        });
    });

    describe("withdrawRewards Test", function () {
        it("withdrawRewards Success and emit LogRewardsWithdrawal", async function () {
            await expect(goosebumpsStaking.connect(accountList[1]).withdrawRewards())
                .to.be.emit(goosebumpsStaking, "LogRewardsWithdrawal");
        });
    });

    describe("unstake Test", function () {
        it("unstake Success and emit LogUnstake", async function () {
            await expect(goosebumpsStaking.connect(accountList[1]).unstake(ethers.utils.parseEther("100")))
                .to.be.emit(goosebumpsStaking, "LogUnstake");
        });
    });

    describe("stake and unstake and withdrawRewards fail because contract is paused", function () {
        before(async function () {
            const setPauseTx = await goosebumpsStaking.connect(accountList[0]).setPause();
            // wait until the transaction is mined
            await setPauseTx.wait();
        });

        it("stake fail because contract is paused", async function () {
            const approveTx = await stakeToken.connect(accountList[1]).approve(goosebumpsStaking.address, ethers.utils.parseEther("100"));
            await approveTx.wait();

            await expect(goosebumpsStaking.connect(accountList[1]).stake(ethers.utils.parseEther("100")))
                .to.revertedWith('Pausable: paused');
        });

        it("unstake fail because contract is paused", async function () {
            await expect(goosebumpsStaking.connect(accountList[1]).unstake(ethers.utils.parseEther("100")))
                .to.revertedWith('Pausable: paused');
        });

        it("withdrawRewards fail because contract is paused", async function () {
            await expect(goosebumpsStaking.connect(accountList[1]).withdrawRewards())
                .to.revertedWith('Pausable: paused');
        });

        after(async function () {
            const setUnpauseTx = await goosebumpsStaking.connect(accountList[0]).setUnpause();

            await setUnpauseTx.wait();
        });
    });

    describe("stake and unstake and withdrawRewards fail with reverted string", function () {
        it("stake fail because not approved", async function () {
            let approveTx = await stakeToken.connect(accountList[1]).approve(goosebumpsStaking.address, ethers.utils.parseEther("0"));
            await approveTx.wait();
            await expect(goosebumpsStaking.connect(accountList[1]).stake(ethers.utils.parseEther("100")))
                .to.revertedWith('ERC20: insufficient allowance');
        });

        it("stake fail because staking amount is zero", async function () {
            await expect(goosebumpsStaking.connect(accountList[1]).stake(0))
                .to.revertedWith('Staking amount must be greater than zero');
        });

        it("stake fail because 'Insufficient stakeToken balance'", async function () {
            await expect(goosebumpsStaking.connect(accountList[1]).stake(ethers.utils.parseEther("100000")))
                .to.revertedWith('Insufficient stakeToken balance');
        });

        it("unstake fail because not approved", async function () {
            let approveTx = await stakeToken.connect(accountList[1]).approve(goosebumpsStaking.address, ethers.utils.parseEther("100"));
            await approveTx.wait();

            await expect(goosebumpsStaking.connect(accountList[1]).stake(ethers.utils.parseEther("100")))
                .to.be.emit(goosebumpsStaking, "LogStake").withArgs(accountList[1].address, ethers.utils.parseEther("100"));

            approveTx = await stakeToken.connect(accountList[0]).approve(goosebumpsStaking.address, ethers.utils.parseEther("0"));
            await approveTx.wait();
            await expect(goosebumpsStaking.connect(accountList[1]).unstake(ethers.utils.parseEther("100")))
                .to.revertedWith('ERC20: insufficient allowance');

            approveTx = await stakeToken.connect(accountList[0]).approve(goosebumpsStaking.address, ethers.utils.parseEther("100000000000000000000"));
            await approveTx.wait();
        });

        it("unstake fail because unstaking amount is zero", async function () {
            await expect(goosebumpsStaking.connect(accountList[1]).unstake(0))
                .to.revertedWith('Unstaking amount must be greater than zero');
        });

        it("unstake fail because 'Insufficient unstake'", async function () {
            await expect(goosebumpsStaking.connect(accountList[1]).unstake(ethers.utils.parseEther("1000")))
                .to.revertedWith('Insufficient unstake');
        });

        it("unstake fail because reward wallet not approved", async function () {
            let approveTx = await rewardToken.connect(accountList[0]).approve(goosebumpsStaking.address, ethers.utils.parseEther("0"));
            await approveTx.wait();

            await expect(goosebumpsStaking.connect(accountList[1]).unstake(ethers.utils.parseEther("10")))
                .to.revertedWith('ERC20: insufficient allowance');
        });

        it("withdrawRewards fail because reward wallet not approved", async function () {
            await expect(goosebumpsStaking.connect(accountList[1]).withdrawRewards())
                .to.revertedWith('ERC20: insufficient allowance');

            let approveTx = await rewardToken.connect(accountList[0]).approve(goosebumpsStaking.address, ethers.utils.parseEther("100000000000000000000"));
            await approveTx.wait();
        });
    });

    describe("stake and unstake and withdrawRewards success with mutilcase", function () {
        before(async function () {
            let approveTx = await stakeToken.connect(staker1).approve(goosebumpsStaking.address, ethers.utils.parseEther("10000"));
            await approveTx.wait();

            approveTx = await stakeToken.connect(staker2).approve(goosebumpsStaking.address, ethers.utils.parseEther("10000"));
            await approveTx.wait();
        });

        describe("multi-stake and multi-unstake and multi-withdrawRewards success", function () {
            it("stake and stake success with another stakers", async function () {
                await expect(goosebumpsStaking.connect(staker1).stake(ethers.utils.parseEther("100")))
                    .to.be.emit(goosebumpsStaking, "LogStake").withArgs(staker1.address, ethers.utils.parseEther("100"));

                await expect(goosebumpsStaking.connect(staker1).stake(ethers.utils.parseEther("100")))
                    .to.be.emit(goosebumpsStaking, "LogStake").withArgs(staker1.address, ethers.utils.parseEther("100"));

                await expect(goosebumpsStaking.connect(staker2).stake(ethers.utils.parseEther("100")))
                    .to.be.emit(goosebumpsStaking, "LogStake").withArgs(staker2.address, ethers.utils.parseEther("100"));

                await expect(goosebumpsStaking.connect(staker2).stake(ethers.utils.parseEther("100")))
                    .to.be.emit(goosebumpsStaking, "LogStake").withArgs(staker2.address, ethers.utils.parseEther("100"));

                await expect(goosebumpsStaking.connect(staker1).stake(ethers.utils.parseEther("100")))
                    .to.be.emit(goosebumpsStaking, "LogStake").withArgs(staker1.address, ethers.utils.parseEther("100"));
            });

            it("unstake and unstake success with another stakers", async function () {
                await expect(goosebumpsStaking.connect(staker1).unstake(ethers.utils.parseEther("20")))
                    .to.be.emit(goosebumpsStaking, "LogUnstake");

                await expect(goosebumpsStaking.connect(staker1).unstake(ethers.utils.parseEther("20")))
                    .to.be.emit(goosebumpsStaking, "LogUnstake");

                await expect(goosebumpsStaking.connect(staker2).unstake(ethers.utils.parseEther("20")))
                    .to.be.emit(goosebumpsStaking, "LogUnstake");

                await expect(goosebumpsStaking.connect(staker2).unstake(ethers.utils.parseEther("20")))
                    .to.be.emit(goosebumpsStaking, "LogUnstake");

                await expect(goosebumpsStaking.connect(staker1).unstake(ethers.utils.parseEther("20")))
                    .to.be.emit(goosebumpsStaking, "LogUnstake");
            });

            it("withdrawRewards and withdrawRewards success with another stakers", async function () {
                await expect(goosebumpsStaking.connect(staker1).withdrawRewards())
                    .to.be.emit(goosebumpsStaking, "LogRewardsWithdrawal");

                await expect(goosebumpsStaking.connect(staker1).withdrawRewards())
                    .to.be.emit(goosebumpsStaking, "LogRewardsWithdrawal");

                await expect(goosebumpsStaking.connect(staker2).withdrawRewards())
                    .to.be.emit(goosebumpsStaking, "LogRewardsWithdrawal");

                await expect(goosebumpsStaking.connect(staker2).withdrawRewards())
                    .to.be.emit(goosebumpsStaking, "LogRewardsWithdrawal");

                await expect(goosebumpsStaking.connect(staker1).withdrawRewards())
                    .to.be.emit(goosebumpsStaking, "LogRewardsWithdrawal");
            });
        });

        describe("multi-stake-unstake-withdrawRewards success", function () {
            it("stake-unstake-withdrawRewards success with another stakers", async function () {
                await expect(goosebumpsStaking.connect(staker1).stake(ethers.utils.parseEther("100")))
                    .to.be.emit(goosebumpsStaking, "LogStake").withArgs(staker1.address, ethers.utils.parseEther("100"));

                await expect(goosebumpsStaking.connect(staker2).unstake(ethers.utils.parseEther("20")))
                    .to.be.emit(goosebumpsStaking, "LogUnstake");

                await expect(goosebumpsStaking.connect(staker1).withdrawRewards())
                    .to.be.emit(goosebumpsStaking, "LogRewardsWithdrawal");

                await expect(goosebumpsStaking.connect(staker2).withdrawRewards())
                    .to.be.emit(goosebumpsStaking, "LogRewardsWithdrawal");

                await expect(goosebumpsStaking.connect(staker1).unstake(ethers.utils.parseEther("20")))
                    .to.be.emit(goosebumpsStaking, "LogUnstake");

                await expect(goosebumpsStaking.connect(staker2).stake(ethers.utils.parseEther("20")))
                    .to.be.emit(goosebumpsStaking, "LogStake").withArgs(staker2.address, ethers.utils.parseEther("20"));

                await expect(goosebumpsStaking.connect(staker1).withdrawRewards())
                    .to.be.emit(goosebumpsStaking, "LogRewardsWithdrawal");

                await expect(goosebumpsStaking.connect(staker2).stake(ethers.utils.parseEther("20")))
                    .to.be.emit(goosebumpsStaking, "LogStake").withArgs(staker2.address, ethers.utils.parseEther("20"));
            });
        });
    });

    describe("setTreasury Test", function () {
        it("Set success", async function () {
            const setTreasuryTx = await goosebumpsStaking.connect(accountList[0]).setTreasury(accountList[1].address);

            // wait until the transaction is mined
            await setTreasuryTx.wait();

            expect(await goosebumpsStaking.connect(accountList[0]).TREASURY()).to.equal(accountList[1].address);
        });

        it("Set fail because setter is not owner", async function () {
            await expect(goosebumpsStaking.connect(accountList[1]).setTreasury(accountList[0].address)).to.revertedWith('Ownable: caller is not the owner');
        });

        it("Set success and emit LogSetTreasury", async function () {
            await expect(goosebumpsStaking.connect(accountList[0]).setTreasury(accountList[0].address))
                .to.emit(goosebumpsStaking, "LogSetTreasury").withArgs(accountList[0].address);

            expect(await goosebumpsStaking.connect(accountList[1]).TREASURY()).to.equal(accountList[0].address);
        });
    });

    describe("setRewardWallet Test", function () {
        it("Set success", async function () {
            const setRewardWalletTx = await goosebumpsStaking.connect(accountList[0]).setRewardWallet(accountList[2].address);

            // wait until the transaction is mined
            await setRewardWalletTx.wait();

            expect(await goosebumpsStaking.connect(accountList[0]).REWARD_WALLET()).to.equal(accountList[2].address);
        });

        it("Set fail because setter is not owner", async function () {
            await expect(goosebumpsStaking.connect(accountList[1]).setRewardWallet(accountList[0].address)).to.revertedWith('Ownable: caller is not the owner');
        });

        it("Set success and emit LogSetRewardWallet", async function () {
            await expect(goosebumpsStaking.connect(accountList[0]).setRewardWallet(accountList[0].address))
                .to.emit(goosebumpsStaking, "LogSetRewardWallet").withArgs(accountList[0].address);

            expect(await goosebumpsStaking.connect(accountList[1]).TREASURY()).to.equal(accountList[0].address);
        });
    });

    describe("setPause and setUnpause Test", function () {
        it("setPause success", async function () {
            const setPauseTx = await goosebumpsStaking.connect(accountList[0]).setPause();

            // wait until the transaction is mined
            await setPauseTx.wait();

            expect(await goosebumpsStaking.connect(accountList[0]).paused()).to.equal(true);
        });

        it("setPause fail because already paused", async function () {
            await expect(goosebumpsStaking.connect(accountList[0]).setPause()).to.revertedWith('Pausable: paused');
        });

        it("setUnpause success", async function () {
            const setUnpauseTx = await goosebumpsStaking.connect(accountList[0]).setUnpause();

            await setUnpauseTx.wait();

            expect(await goosebumpsStaking.connect(accountList[0]).paused()).to.equal(false);
        });

        it("setUnpause fail because already unpaused", async function () {
            await expect(goosebumpsStaking.connect(accountList[0]).setUnpause()).to.revertedWith('Pausable: not paused');
        });

        it("setPause fail because setter is not owner", async function () {
            await expect(goosebumpsStaking.connect(accountList[1]).setPause()).to.revertedWith('Ownable: caller is not the owner');
        });

        it("setUnpause fail because setter is not owner", async function () {
            await expect(goosebumpsStaking.connect(accountList[1]).setUnpause()).to.revertedWith('Ownable: caller is not the owner');
        });

        it("setPause success and emit Paused", async function () {
            await expect(goosebumpsStaking.connect(accountList[0]).setPause())
                .to.emit(goosebumpsStaking, "Paused").withArgs(accountList[0].address);

            expect(await goosebumpsStaking.connect(accountList[1]).paused()).to.equal(true);
        });

        it("setUnpause success and emit Unpaused", async function () {
            await expect(goosebumpsStaking.connect(accountList[0]).setUnpause())
                .to.emit(goosebumpsStaking, "Unpaused").withArgs(accountList[0].address);

            expect(await goosebumpsStaking.connect(accountList[1]).paused()).to.equal(false);
        });
    });
});
