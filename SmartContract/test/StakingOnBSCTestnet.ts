import { expect } from "chai";
import hre, { ethers } from "hardhat";

import gooseBumpsStakingAbi from "../artifacts/contracts/Stake/GooseBumpsStaking.sol/GooseBumpsStaking.json"
import tokenAbi from "../artifacts/contracts/Token.sol/Token.json"

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { Contract } from "ethers";

let accountList: SignerWithAddress[];
let gooseBumpsStaking: Contract;
let stakeToken: Contract;
let rewardToken: Contract;

before(async function () {
    accountList = await ethers.getSigners();

    stakeToken = new ethers.Contract('0xD6cf8aeEeBf84C43e28934D6D743820195BBa59C', tokenAbi.abi, ethers.provider)
    rewardToken = new ethers.Contract('0xA1a83bC7712f65E646933a5E00A90537Fc847835', tokenAbi.abi, ethers.provider)
    gooseBumpsStaking = new ethers.Contract('0xcC95a853928dC9b661EB5355661E3Bbc70c7b96e', gooseBumpsStakingAbi.abi, ethers.provider)

    console.log("stakeToken: ", stakeToken.address);
    console.log("rewardToken: ", rewardToken.address);
    console.log("Treasury: ", await stakeToken.owner());
    console.log("Reward Wallet: ", await rewardToken.owner());
    console.log("rewardPerBlockTokenN: ", await gooseBumpsStaking.rewardPerBlockTokenN());
    console.log("rewardPerBlockTokenD: ", await gooseBumpsStaking.rewardPerBlockTokenD());

    for (let i = 1; i < accountList.length; i++) {
        if (parseFloat(ethers.utils.formatEther(await stakeToken.balanceOf(accountList[i].address))) < 9999) {
            await expect(stakeToken.connect(accountList[0]).transfer(accountList[i].address, ethers.utils.parseEther("10000")))
                .to.emit(stakeToken, "Transfer").withArgs(accountList[0].address, accountList[i].address, ethers.utils.parseEther("10000"));
            console.log("balance of %s is %sStake Token", accountList[i].address, ethers.utils.formatEther(await stakeToken.balanceOf(accountList[i].address)))
        }
    }

    // console.log(accountList.length)
    // for (let i = 0; i < accountList.length; i++)
    //     console.log("## ", accountList[i].address);
})

describe("GooseBumpsStaking Test", function () {

    describe("stake Test", function () {
        it("Stake Success and emit LogStake", async function () {
            const approveTx = await stakeToken.connect(accountList[1]).approve(gooseBumpsStaking.address, ethers.utils.parseEther("100"));
            await approveTx.wait();

            await expect(gooseBumpsStaking.connect(accountList[1]).stake(ethers.utils.parseEther("100")))
                .to.emit(gooseBumpsStaking, "LogStake").withArgs(accountList[1].address, ethers.utils.parseEther("100"));
        });
    });

    describe("setTreasury Test", function () {
        it("Set success", async function () {
            const setTreasuryTx = await gooseBumpsStaking.connect(accountList[0]).setTreasury(accountList[1].address);

            // wait until the transaction is mined
            await setTreasuryTx.wait();

            expect(await gooseBumpsStaking.connect(accountList[0]).TREASURY()).to.equal(accountList[1].address);
        });

        it("Set fail because setter is not owner", async function () {
            await expect(gooseBumpsStaking.connect(accountList[1]).setTreasury(accountList[0].address)).to.revertedWith('Ownable: caller is not the owner');
        });

        it("Set success and emit LogSetTreasury", async function () {
            await expect(gooseBumpsStaking.connect(accountList[0]).setTreasury(accountList[0].address))
                .to.emit(gooseBumpsStaking, "LogSetTreasury").withArgs(accountList[0].address);

            expect(await gooseBumpsStaking.connect(accountList[1]).TREASURY()).to.equal(accountList[0].address);
        });
    });

    describe("setRewardWallet Test", function () {
        it("Set success", async function () {
            const setRewardWalletTx = await gooseBumpsStaking.connect(accountList[0]).setRewardWallet(accountList[2].address);

            // wait until the transaction is mined
            await setRewardWalletTx.wait();

            expect(await gooseBumpsStaking.connect(accountList[0]).REWARD_WALLET()).to.equal(accountList[2].address);
        });

        it("Set fail because setter is not owner", async function () {
            await expect(gooseBumpsStaking.connect(accountList[1]).setRewardWallet(accountList[0].address)).to.revertedWith('Ownable: caller is not the owner');
        });

        it("Set success and emit LogSetRewardWallet", async function () {
            await expect(gooseBumpsStaking.connect(accountList[0]).setRewardWallet(accountList[0].address))
                .to.emit(gooseBumpsStaking, "LogSetRewardWallet").withArgs(accountList[0].address);

            expect(await gooseBumpsStaking.connect(accountList[1]).TREASURY()).to.equal(accountList[0].address);
        });
    });

    describe("setPause and setUnpause Test", function () {
        it("setPause success", async function () {
            const setPauseTx = await gooseBumpsStaking.connect(accountList[0]).setPause();

            // wait until the transaction is mined
            await setPauseTx.wait();

            expect(await gooseBumpsStaking.connect(accountList[0]).paused()).to.equal(true);
        });

        it("setPause fail because already paused", async function () {
            await expect(gooseBumpsStaking.connect(accountList[0]).setPause()).to.revertedWith('Pausable: paused');
        });

        it("setUnpause success", async function () {
            const setUnpauseTx = await gooseBumpsStaking.connect(accountList[0]).setUnpause();

            await setUnpauseTx.wait();

            expect(await gooseBumpsStaking.connect(accountList[0]).paused()).to.equal(false);
        });

        it("setUnpause fail because already unpaused", async function () {
            await expect(gooseBumpsStaking.connect(accountList[0]).setUnpause()).to.revertedWith('Pausable: not paused');
        });

        it("setPause fail because setter is not owner", async function () {
            await expect(gooseBumpsStaking.connect(accountList[1]).setPause()).to.revertedWith('Ownable: caller is not the owner');
        });

        it("setUnpause fail because setter is not owner", async function () {
            await expect(gooseBumpsStaking.connect(accountList[1]).setUnpause()).to.revertedWith('Ownable: caller is not the owner');
        });

        it("setPause success and emit Paused", async function () {
            await expect(gooseBumpsStaking.connect(accountList[0]).setPause())
                .to.emit(gooseBumpsStaking, "Paused").withArgs(accountList[0].address);

            expect(await gooseBumpsStaking.connect(accountList[1]).paused()).to.equal(true);
        });

        it("setUnpause success and emit Unpaused", async function () {
            await expect(gooseBumpsStaking.connect(accountList[0]).setUnpause())
                .to.emit(gooseBumpsStaking, "Unpaused").withArgs(accountList[0].address);

            expect(await gooseBumpsStaking.connect(accountList[1]).paused()).to.equal(false);
        });
    });

    describe("withdrawETH and withdrawToken Test", function () {
        describe("withdrawETH Test", function () {
            let balance;
            it("withdrawETH success", async function () {
                const prewithdrawETHTx = await gooseBumpsStaking.connect(accountList[0])
                    .withdrawETH(accountList[1].address, await ethers.provider.getBalance(gooseBumpsStaking.address));

                await prewithdrawETHTx.wait();

                const transferETHTx = await accountList[0].sendTransaction({ to: gooseBumpsStaking.address, value: ethers.utils.parseEther("0.1"), gasPrice: 10, gasLimit: 21000 })
                await transferETHTx.wait();
                console.log("           transferETHTx hash: ", transferETHTx.hash);

                balance = await accountList[1].getBalance();
                console.log("           ETHBalance of accountList[1]: ", ethers.utils.formatEther(balance))
                balance = await ethers.provider.getBalance(gooseBumpsStaking.address);
                console.log("           ETHBalance of gooseBumpsStaking: ", ethers.utils.formatEther(balance))

                const withdrawETHTx = await gooseBumpsStaking.connect(accountList[0]).withdrawETH(accountList[1].address, ethers.utils.parseEther("0.05"));

                await withdrawETHTx.wait();

                console.log("           withdrawETHTx hash: ", withdrawETHTx.hash);

                balance = await accountList[1].getBalance();
                console.log("           ETHBalance of accountList[1]: ", ethers.utils.formatEther(balance))
                balance = await ethers.provider.getBalance(gooseBumpsStaking.address);
                console.log("           ETHBalance of gooseBumpsStaking: ", ethers.utils.formatEther(balance))
            });

            it("withdrawETH success with emit 'LogWithdrawalETH'", async function () {
                await expect(gooseBumpsStaking.connect(accountList[0]).withdrawETH(accountList[1].address, ethers.utils.parseEther("0.025")))
                    .to.emit(gooseBumpsStaking, "LogWithdrawalETH").withArgs(accountList[1].address, ethers.utils.parseEther("0.025"));

                balance = await accountList[1].getBalance();
                console.log("           ETHBalance of accountList[1]: ", ethers.utils.formatEther(balance))
                balance = await ethers.provider.getBalance(gooseBumpsStaking.address);
                console.log("           ETHBalance of gooseBumpsStaking: ", ethers.utils.formatEther(balance))
            });

            it("withdrawETH fail because caller is not the owner", async function () {
                await expect(gooseBumpsStaking.connect(accountList[1]).withdrawToken(rewardToken.address, accountList[1].address, ethers.utils.parseEther("0.01")))
                    .to.revertedWith('Ownable: caller is not the owner');

                balance = await accountList[1].getBalance();
                console.log("           ETHBalance of accountList[1]: ", ethers.utils.formatEther(balance))
                balance = await ethers.provider.getBalance(gooseBumpsStaking.address);
                console.log("           ETHBalance of gooseBumpsStaking: ", ethers.utils.formatEther(balance))
            });

            it("withdrawETH fail revertedWith 'INSUFFICIENT_FUNDS'", async function () {
                await expect(gooseBumpsStaking.connect(accountList[0]).withdrawETH(accountList[1].address, ethers.utils.parseEther("0.03")))
                    .to.revertedWith('INSUFFICIENT_FUNDS');
            });
        });

        describe("withdrawToken Test", function () {
            let balance;
            it("withdrawToken success", async function () {

                const prewithdrawTokenTx = await gooseBumpsStaking.connect(accountList[0])
                    .withdrawToken(rewardToken.address, accountList[1].address, await rewardToken.balanceOf(gooseBumpsStaking.address));

                await prewithdrawTokenTx.wait();

                const transferTx = await rewardToken.connect(accountList[0]).transfer(gooseBumpsStaking.address, ethers.utils.parseEther("100"));

                await transferTx.wait();

                balance = await rewardToken.balanceOf(accountList[1].address);

                console.log("           balance: ", ethers.utils.formatEther(balance))

                const withdrawTokenTx = await gooseBumpsStaking.connect(accountList[0]).withdrawToken(rewardToken.address, accountList[1].address, ethers.utils.parseEther("50"));

                await withdrawTokenTx.wait();

                console.log("           withdrawTokenTx hash: ", withdrawTokenTx.hash);

                balance = await rewardToken.balanceOf(accountList[1].address);
                console.log("           balance: ", ethers.utils.formatEther(balance))
            });

            it("withdrawToken success with emit 'LogWithdrawToken'", async function () {
                await expect(gooseBumpsStaking.connect(accountList[0]).withdrawToken(rewardToken.address, accountList[1].address, ethers.utils.parseEther("25")))
                    .to.emit(gooseBumpsStaking, "LogWithdrawToken").withArgs(rewardToken.address, accountList[1].address, ethers.utils.parseEther("25"));

                balance = await rewardToken.balanceOf(accountList[1].address);
                console.log("           balance: ", ethers.utils.formatEther(balance))
            });

            it("withdrawToken fail because caller is not the owner", async function () {
                await expect(gooseBumpsStaking.connect(accountList[1]).withdrawToken(rewardToken.address, accountList[1].address, ethers.utils.parseEther("10")))
                    .to.revertedWith('Ownable: caller is not the owner');
            });

            it("withdrawToken fail revertedWith 'INSUFFICIENT_FUNDS'", async function () {
                balance = await rewardToken.balanceOf(gooseBumpsStaking.address);
                console.log("           balanceOf gooseBumpsStaking: ", ethers.utils.formatEther(balance))
                await expect(gooseBumpsStaking.connect(accountList[0]).withdrawToken(rewardToken.address, accountList[1].address, ethers.utils.parseEther("30")))
                    .to.revertedWith('INSUFFICIENT_FUNDS');
            });
        });
    });
});
