import { expect } from "chai";
import { ethers } from "hardhat";

import goosebumpsFarmingAbi from "../artifacts/contracts/Farm/GoosebumpsFarming.sol/GoosebumpsFarming.json"
import tokenAbi from "../artifacts/contracts/Token.sol/Token.json";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { Contract } from "ethers";

let accountList: SignerWithAddress[];
let goosebumpsFarming: Contract;
let lpToken: Contract;
let rewardToken: Contract;
let staker1: SignerWithAddress;
let staker2: SignerWithAddress;

before(async function () {
    accountList = await ethers.getSigners();

    lpToken = new ethers.Contract('0xD6cf8aeEeBf84C43e28934D6D743820195BBa59C', tokenAbi.abi, ethers.provider)
    rewardToken = new ethers.Contract('0xA1a83bC7712f65E646933a5E00A90537Fc847835', tokenAbi.abi, ethers.provider)
    goosebumpsFarming = new ethers.Contract('0xcC95a853928dC9b661EB5355661E3Bbc70c7b96e', goosebumpsFarmingAbi.abi, ethers.provider)

    console.log("lpToken: ", lpToken.address);
    console.log("rewardToken: ", rewardToken.address);
    console.log("Treasury: ", await lpToken.owner());
    console.log("Reward Wallet: ", await rewardToken.owner());
    console.log("rewardPerBlockTokenN: ", await goosebumpsFarming.rewardPerBlockTokenN());
    console.log("rewardPerBlockTokenD: ", await goosebumpsFarming.rewardPerBlockTokenD());

    for (let i = 1; i < accountList.length; i++) {
        if (parseFloat(ethers.utils.formatEther(await lpToken.balanceOf(accountList[i].address))) < 999) {
            await expect(lpToken.connect(accountList[0]).transfer(accountList[i].address, ethers.utils.parseEther("10000")))
                .to.emit(lpToken, "Transfer").withArgs(accountList[0].address, accountList[i].address, ethers.utils.parseEther("10000"));
        }
        console.log("Token balance of %s is %s Stake Token", accountList[i].address, ethers.utils.formatEther(await lpToken.balanceOf(accountList[i].address)))

        if (parseFloat(ethers.utils.formatEther(await ethers.provider.getBalance(accountList[i].address))) < 0.099) {
            const transferETHTx = await accountList[0].sendTransaction({ to: accountList[i].address, value: ethers.utils.parseEther("0.1"), gasPrice: ethers.utils.parseUnits("10", 9), gasLimit: 21000 });
            await transferETHTx.wait();
        }
        console.log("ETH balance of %s is %s ETH", accountList[i].address, parseFloat(ethers.utils.formatEther(await ethers.provider.getBalance(accountList[i].address))))
    }

    let approveTx = await lpToken.connect(accountList[0]).approve(goosebumpsFarming.address, ethers.utils.parseEther("100000000000000000000"));
    await approveTx.wait();

    approveTx = await rewardToken.connect(accountList[0]).approve(goosebumpsFarming.address, ethers.utils.parseEther("100000000000000000000"));
    await approveTx.wait();

    staker1 = accountList[5];
    staker2 = accountList[6];

    // console.log(accountList.length)
    // for (let i = 0; i < accountList.length; i++)
    //     console.log("## ", accountList[i].address);
});

describe("GoosebumpsFarming Test", function () {

    describe("stake Test", function () {
        it("stake Success and emit LogStake", async function () {
            const approveTx = await lpToken.connect(accountList[1]).approve(goosebumpsFarming.address, ethers.utils.parseEther("100"));
            await approveTx.wait();

            await expect(goosebumpsFarming.connect(accountList[1]).stake(ethers.utils.parseEther("100")))
                .to.be.emit(goosebumpsFarming, "LogStake").withArgs(accountList[1].address, ethers.utils.parseEther("100"));
        });
    });

    describe("withdrawRewards Test", function () {
        it("withdrawRewards Success and emit LogRewardsWithdrawal", async function () {
            await expect(goosebumpsFarming.connect(accountList[1]).withdrawRewards())
                .to.be.emit(goosebumpsFarming, "LogRewardsWithdrawal");
        });
    });

    describe("unstake Test", function () {
        it("unstake Success and emit LogUnstake", async function () {
            await expect(goosebumpsFarming.connect(accountList[1]).unstake(ethers.utils.parseEther("100")))
                .to.be.emit(goosebumpsFarming, "LogUnstake");
        });
    });

    describe("stake and unstake and withdrawRewards fail because contract is paused", function () {
        before(async function () {
            const setPauseTx = await goosebumpsFarming.connect(accountList[0]).setPause();
            // wait until the transaction is mined
            await setPauseTx.wait();
        });

        it("stake fail because contract is paused", async function () {
            const approveTx = await lpToken.connect(accountList[1]).approve(goosebumpsFarming.address, ethers.utils.parseEther("100"));
            await approveTx.wait();

            await expect(goosebumpsFarming.connect(accountList[1]).stake(ethers.utils.parseEther("100")))
                .to.revertedWith('Pausable: paused');
        });

        it("unstake fail because contract is paused", async function () {
            await expect(goosebumpsFarming.connect(accountList[1]).unstake(ethers.utils.parseEther("100")))
                .to.revertedWith('Pausable: paused');
        });

        it("withdrawRewards fail because contract is paused", async function () {
            await expect(goosebumpsFarming.connect(accountList[1]).withdrawRewards())
                .to.revertedWith('Pausable: paused');
        });

        after(async function () {
            const setUnpauseTx = await goosebumpsFarming.connect(accountList[0]).setUnpause();

            await setUnpauseTx.wait();
        });
    });

    describe("stake and unstake and withdrawRewards fail with reverted string", function () {
        it("stake fail because not approved", async function () {
            let approveTx = await lpToken.connect(accountList[1]).approve(goosebumpsFarming.address, ethers.utils.parseEther("0"));
            await approveTx.wait();
            await expect(goosebumpsFarming.connect(accountList[1]).stake(ethers.utils.parseEther("100")))
                .to.revertedWith('ERC20: insufficient allowance');
        });

        it("stake fail because staking amount is zero", async function () {
            await expect(goosebumpsFarming.connect(accountList[1]).stake(0))
                .to.revertedWith('Staking amount must be greater than zero');
        });

        it("stake fail because 'Insufficient lpToken balance'", async function () {
            await expect(goosebumpsFarming.connect(accountList[1]).stake(ethers.utils.parseEther("100000")))
                .to.revertedWith('Insufficient lpToken balance');
        });

        it("unstake fail because not approved", async function () {
            let approveTx = await lpToken.connect(accountList[1]).approve(goosebumpsFarming.address, ethers.utils.parseEther("100"));
            await approveTx.wait();

            await expect(goosebumpsFarming.connect(accountList[1]).stake(ethers.utils.parseEther("100")))
                .to.be.emit(goosebumpsFarming, "LogStake").withArgs(accountList[1].address, ethers.utils.parseEther("100"));

            approveTx = await lpToken.connect(accountList[0]).approve(goosebumpsFarming.address, ethers.utils.parseEther("0"));
            await approveTx.wait();
            await expect(goosebumpsFarming.connect(accountList[1]).unstake(ethers.utils.parseEther("100")))
                .to.revertedWith('ERC20: insufficient allowance');

            approveTx = await lpToken.connect(accountList[0]).approve(goosebumpsFarming.address, ethers.utils.parseEther("100000000000000000000"));
            await approveTx.wait();
        });

        it("unstake fail because unstaking amount is zero", async function () {
            await expect(goosebumpsFarming.connect(accountList[1]).unstake(0))
                .to.revertedWith('Unstaking amount must be greater than zero');
        });

        it("unstake fail because 'Insufficient unstake'", async function () {
            await expect(goosebumpsFarming.connect(accountList[1]).unstake(ethers.utils.parseEther("1000")))
                .to.revertedWith('Insufficient unstake');
        });

        it("unstake fail because reward wallet not approved", async function () {
            let approveTx = await rewardToken.connect(accountList[0]).approve(goosebumpsFarming.address, ethers.utils.parseEther("0"));
            await approveTx.wait();

            await expect(goosebumpsFarming.connect(accountList[1]).unstake(ethers.utils.parseEther("10")))
                .to.revertedWith('ERC20: insufficient allowance');
        });

        it("withdrawRewards fail because reward wallet not approved", async function () {
            await expect(goosebumpsFarming.connect(accountList[1]).withdrawRewards())
                .to.revertedWith('ERC20: insufficient allowance');

            let approveTx = await rewardToken.connect(accountList[0]).approve(goosebumpsFarming.address, ethers.utils.parseEther("100000000000000000000"));
            await approveTx.wait();
        });
    });

    describe("stake and unstake and withdrawRewards success with mutilcase", function () {
        before(async function () {
            let approveTx = await lpToken.connect(staker1).approve(goosebumpsFarming.address, ethers.utils.parseEther("10000"));
            await approveTx.wait();

            approveTx = await lpToken.connect(staker2).approve(goosebumpsFarming.address, ethers.utils.parseEther("10000"));
            await approveTx.wait();
        });

        describe("multi-stake and multi-unstake and multi-withdrawRewards success", function () {
            it("stake and stake success with another stakers", async function () {
                await expect(goosebumpsFarming.connect(staker1).stake(ethers.utils.parseEther("100")))
                    .to.be.emit(goosebumpsFarming, "LogStake").withArgs(staker1.address, ethers.utils.parseEther("100"));

                await expect(goosebumpsFarming.connect(staker1).stake(ethers.utils.parseEther("100")))
                    .to.be.emit(goosebumpsFarming, "LogStake").withArgs(staker1.address, ethers.utils.parseEther("100"));

                await expect(goosebumpsFarming.connect(staker2).stake(ethers.utils.parseEther("100")))
                    .to.be.emit(goosebumpsFarming, "LogStake").withArgs(staker2.address, ethers.utils.parseEther("100"));

                await expect(goosebumpsFarming.connect(staker2).stake(ethers.utils.parseEther("100")))
                    .to.be.emit(goosebumpsFarming, "LogStake").withArgs(staker2.address, ethers.utils.parseEther("100"));

                await expect(goosebumpsFarming.connect(staker1).stake(ethers.utils.parseEther("100")))
                    .to.be.emit(goosebumpsFarming, "LogStake").withArgs(staker1.address, ethers.utils.parseEther("100"));
            });

            it("unstake and unstake success with another stakers", async function () {
                await expect(goosebumpsFarming.connect(staker1).unstake(ethers.utils.parseEther("20")))
                    .to.be.emit(goosebumpsFarming, "LogUnstake");

                await expect(goosebumpsFarming.connect(staker1).unstake(ethers.utils.parseEther("20")))
                    .to.be.emit(goosebumpsFarming, "LogUnstake");

                await expect(goosebumpsFarming.connect(staker2).unstake(ethers.utils.parseEther("20")))
                    .to.be.emit(goosebumpsFarming, "LogUnstake");

                await expect(goosebumpsFarming.connect(staker2).unstake(ethers.utils.parseEther("20")))
                    .to.be.emit(goosebumpsFarming, "LogUnstake");

                await expect(goosebumpsFarming.connect(staker1).unstake(ethers.utils.parseEther("20")))
                    .to.be.emit(goosebumpsFarming, "LogUnstake");
            });

            it("withdrawRewards and withdrawRewards success with another stakers", async function () {
                await expect(goosebumpsFarming.connect(staker1).withdrawRewards())
                    .to.be.emit(goosebumpsFarming, "LogRewardsWithdrawal");

                await expect(goosebumpsFarming.connect(staker1).withdrawRewards())
                    .to.be.emit(goosebumpsFarming, "LogRewardsWithdrawal");

                await expect(goosebumpsFarming.connect(staker2).withdrawRewards())
                    .to.be.emit(goosebumpsFarming, "LogRewardsWithdrawal");

                await expect(goosebumpsFarming.connect(staker2).withdrawRewards())
                    .to.be.emit(goosebumpsFarming, "LogRewardsWithdrawal");

                await expect(goosebumpsFarming.connect(staker1).withdrawRewards())
                    .to.be.emit(goosebumpsFarming, "LogRewardsWithdrawal");
            });
        });

        describe("multi-stake-unstake-withdrawRewards success", function () {
            it("stake-unstake-withdrawRewards success with another stakers", async function () {
                await expect(goosebumpsFarming.connect(staker1).stake(ethers.utils.parseEther("100")))
                    .to.be.emit(goosebumpsFarming, "LogStake").withArgs(staker1.address, ethers.utils.parseEther("100"));

                await expect(goosebumpsFarming.connect(staker2).unstake(ethers.utils.parseEther("20")))
                    .to.be.emit(goosebumpsFarming, "LogUnstake");

                await expect(goosebumpsFarming.connect(staker1).withdrawRewards())
                    .to.be.emit(goosebumpsFarming, "LogRewardsWithdrawal");

                await expect(goosebumpsFarming.connect(staker2).withdrawRewards())
                    .to.be.emit(goosebumpsFarming, "LogRewardsWithdrawal");

                await expect(goosebumpsFarming.connect(staker1).unstake(ethers.utils.parseEther("20")))
                    .to.be.emit(goosebumpsFarming, "LogUnstake");

                await expect(goosebumpsFarming.connect(staker2).stake(ethers.utils.parseEther("20")))
                    .to.be.emit(goosebumpsFarming, "LogStake").withArgs(staker2.address, ethers.utils.parseEther("20"));

                await expect(goosebumpsFarming.connect(staker1).withdrawRewards())
                    .to.be.emit(goosebumpsFarming, "LogRewardsWithdrawal");

                await expect(goosebumpsFarming.connect(staker2).stake(ethers.utils.parseEther("20")))
                    .to.be.emit(goosebumpsFarming, "LogStake").withArgs(staker2.address, ethers.utils.parseEther("20"));
            });
        });
    });

    describe("setTreasury Test", function () {
        it("Set success", async function () {
            const setTreasuryTx = await goosebumpsFarming.connect(accountList[0]).setTreasury(accountList[1].address);

            // wait until the transaction is mined
            await setTreasuryTx.wait();

            expect(await goosebumpsFarming.connect(accountList[0]).TREASURY()).to.equal(accountList[1].address);
        });

        it("Set fail because setter is not owner", async function () {
            await expect(goosebumpsFarming.connect(accountList[1]).setTreasury(accountList[0].address)).to.revertedWith('Ownable: caller is not the owner');
        });

        it("Set success and emit LogSetTreasury", async function () {
            await expect(goosebumpsFarming.connect(accountList[0]).setTreasury(accountList[0].address))
                .to.emit(goosebumpsFarming, "LogSetTreasury").withArgs(accountList[0].address);

            expect(await goosebumpsFarming.connect(accountList[1]).TREASURY()).to.equal(accountList[0].address);
        });
    });

    describe("setRewardWallet Test", function () {
        it("Set success", async function () {
            const setRewardWalletTx = await goosebumpsFarming.connect(accountList[0]).setRewardWallet(accountList[2].address);

            // wait until the transaction is mined
            await setRewardWalletTx.wait();

            expect(await goosebumpsFarming.connect(accountList[0]).REWARD_WALLET()).to.equal(accountList[2].address);
        });

        it("Set fail because setter is not owner", async function () {
            await expect(goosebumpsFarming.connect(accountList[1]).setRewardWallet(accountList[0].address)).to.revertedWith('Ownable: caller is not the owner');
        });

        it("Set success and emit LogSetRewardWallet", async function () {
            await expect(goosebumpsFarming.connect(accountList[0]).setRewardWallet(accountList[0].address))
                .to.emit(goosebumpsFarming, "LogSetRewardWallet").withArgs(accountList[0].address);

            expect(await goosebumpsFarming.connect(accountList[1]).TREASURY()).to.equal(accountList[0].address);
        });
    });

    describe("setPause and setUnpause Test", function () {
        it("setPause success", async function () {
            const setPauseTx = await goosebumpsFarming.connect(accountList[0]).setPause();

            // wait until the transaction is mined
            await setPauseTx.wait();

            expect(await goosebumpsFarming.connect(accountList[0]).paused()).to.equal(true);
        });

        it("setPause fail because already paused", async function () {
            await expect(goosebumpsFarming.connect(accountList[0]).setPause()).to.revertedWith('Pausable: paused');
        });

        it("setUnpause success", async function () {
            const setUnpauseTx = await goosebumpsFarming.connect(accountList[0]).setUnpause();

            await setUnpauseTx.wait();

            expect(await goosebumpsFarming.connect(accountList[0]).paused()).to.equal(false);
        });

        it("setUnpause fail because already unpaused", async function () {
            await expect(goosebumpsFarming.connect(accountList[0]).setUnpause()).to.revertedWith('Pausable: not paused');
        });

        it("setPause fail because setter is not owner", async function () {
            await expect(goosebumpsFarming.connect(accountList[1]).setPause()).to.revertedWith('Ownable: caller is not the owner');
        });

        it("setUnpause fail because setter is not owner", async function () {
            await expect(goosebumpsFarming.connect(accountList[1]).setUnpause()).to.revertedWith('Ownable: caller is not the owner');
        });

        it("setPause success and emit Paused", async function () {
            await expect(goosebumpsFarming.connect(accountList[0]).setPause())
                .to.emit(goosebumpsFarming, "Paused").withArgs(accountList[0].address);

            expect(await goosebumpsFarming.connect(accountList[1]).paused()).to.equal(true);
        });

        it("setUnpause success and emit Unpaused", async function () {
            await expect(goosebumpsFarming.connect(accountList[0]).setUnpause())
                .to.emit(goosebumpsFarming, "Unpaused").withArgs(accountList[0].address);

            expect(await goosebumpsFarming.connect(accountList[1]).paused()).to.equal(false);
        });
    });
});
