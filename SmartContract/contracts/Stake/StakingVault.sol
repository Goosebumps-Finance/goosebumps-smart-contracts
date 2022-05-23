// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./ITresuary.sol";
import "./IRewardWallet.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract GooseBumpsStaking is Ownable {
    struct StakerInfo {
        uint256 amount;
        uint256 startTime;
        uint256 stakeRewards;
    }

    // Staker Info
    mapping(address => StakerInfo) public staker;

    uint256 rewardRate = 86400;
    uint256 oldRewardRate;
    uint256 rewardRateUpdatedTime;

    ITresuary public tresuary;
    IRewardWallet public rewardWallet;

    IERC20 public stakeToken;
    IERC20 public rewardsToken;

    event Stake(address indexed from, uint256 amount);
    event Unstake(address indexed from, uint256 amount);
    event RewardsWithdrawal(address indexed to, uint256 amount);
    event RewardRateUpdated(uint256 oldRate, uint256 newRate);
    event TresuaryUpdated(ITresuary oldTresuary, ITresuary newTresuary);
    event RewardWalletUpdated(
        IRewardWallet oldRewardWallet,
        IRewardWallet newRewardWallet
    );

    constructor(IERC20 _stakeToken, IERC20 _rewardsToken) {
        stakeToken = _stakeToken;
        rewardsToken = _rewardsToken;
    }

    function stake(uint256 _amount) public {
        require(
            _amount > 0 && stakeToken.balanceOf(msg.sender) >= _amount,
            "Incufficient stakeToken balance"
        );

        if (staker[msg.sender].amount > 0) {
            staker[msg.sender].stakeRewards = getTotalRewards(msg.sender);
        }

        tresuary.deposit(msg.sender, _amount);
        staker[msg.sender].amount += _amount;
        staker[msg.sender].startTime = block.timestamp;
        emit Stake(msg.sender, _amount);
    }

    function unstake(uint256 _amount) public {
        require(staker[msg.sender].amount >= _amount, "Nothing to unstake");
        uint256 rewards = getTotalRewards(msg.sender);
        staker[msg.sender].startTime = block.timestamp;
        staker[msg.sender].amount -= _amount;
        tresuary.withdraw(msg.sender, _amount);
        stakeRewards[msg.sender] = rewards;
        emit Unstake(msg.sender, _amount);
    }

    function withdrawRewards() external {
        uint256 toWithdraw = getTotalRewards(msg.sender);

        require(toWithdraw > 0, "Incufficient rewards balance");

        staker[msg.sender].stakeRewards = 0;

        staker[msg.sender].startTime = block.timestamp;
        rewardWallet.transfer(msg.sender, toWithdraw);
        emit RewardsWithdrawal(msg.sender, toWithdraw);
    }

    function getDeltaTime(address _staker) public view returns (uint256) {
        return block.timestamp - staker[_staker].startTime;
    }

    function getTotalRewards(address _staker) public view returns (uint256) {
        uint256 newRewards = 0;
        if (
            block.timestamp > rewardRateUpdatedTime &&
            startTime[_staker] < rewardRateUpdatedTime
        ) {
            uint256 time1 = rewardRateUpdatedTime - startTime[_staker];
            uint256 timeRate1 = (time1 * 10**18) / oldRewardRate;
            uint256 rewardsPart1 = (stakingBalance[_staker] * timeRate1) /
                10**18;

            uint256 time2 = block.timestamp - rewardRateUpdatedTime;
            uint256 timeRate2 = (time2 * 10**18) / rewardRate;
            uint256 rewardsPart2 = (stakingBalance[_staker] * timeRate2) /
                10**18;

            newRewards = rewardsPart1 + rewardsPart2;
        } else {
            uint256 time = getDeltaTime(_staker) * 10**18;
            uint256 timeRate = time / rewardRate;
            newRewards = (stakingBalance[_staker] * timeRate) / 10**18;
        }
        return newRewards + staker[_staker].stakeRewards;
    }

    function setRewardRate(uint256 _rewardRate) external onlyOwner {
        emit RewardRateUpdated(rewardRate, _rewardRate);
        rewardRateUpdatedTime = block.timestamp;
        oldRewardRate = rewardRate;
        rewardRate = _rewardRate;
    }

    function setTresuary(ITresuary _tresuary) external onlyOwner {
        emit TresuaryUpdated(tresuary, _tresuary);
        tresuary = _tresuary;
    }

    function setRewardWallet(IRewardWallet _rewardWallet) external onlyOwner {
        emit RewardWalletUpdated(rewardWallet, _rewardWallet);
        rewardWallet = _rewardWallet;
    }

    function getRewardRate() external view returns (uint256) {
        return rewardRate;
    }
}
