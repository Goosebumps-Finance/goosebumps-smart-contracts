// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract GooseBumpsStaking is Ownable, Pausable {
    struct StakerInfo {
        uint256 amount;
        uint256 startTime;
        uint256 stakeRewards;
    }

    // Staker Info
    mapping(address => StakerInfo) public staker;

    uint256 rewardRate = 86400;
    uint256 oldRewardRate = rewardRate;
    uint256 rewardRateUpdatedTime;

    address public TREASURY;
    address public REWARD_WALLET;

    IERC20 public stakeToken;
    IERC20 public rewardsToken;

    event LogStake(address indexed from, uint256 amount);
    event LogUnstake(address indexed from, uint256 amount);
    event LogRewardsWithdrawal(address indexed to, uint256 amount);
    event LogSetRewardRate(uint256 rewardRate);
    event LogSetTreasury(address indexed newTreasury);
    event LogSetRewardWallet(address indexed newRewardWallet);
    event LogReceived(address indexed, uint);
    event LogFallback(address indexed, uint);
    event LogWithdrawalBNB(address indexed account, uint256 amount);
    event LogWithdrawToken(address indexed token, address indexed account, uint256 amount);

    constructor(IERC20 _stakeToken, IERC20 _rewardsToken) {
        stakeToken = _stakeToken;
        rewardsToken = _rewardsToken;
        rewardRateUpdatedTime = block.timestamp;
    }

    function stake(uint256 _amount) external whenNotPaused {
        require(
            _amount > 0 && stakeToken.balanceOf(msg.sender) >= _amount,
            "Insufficient stakeToken balance"
        );

        if (staker[msg.sender].amount > 0) {
            staker[msg.sender].stakeRewards = getTotalRewards(msg.sender);
        }

        stakeToken.transferFrom(msg.sender, TREASURY, _amount);
        staker[msg.sender].amount += _amount;
        staker[msg.sender].startTime = block.timestamp;
        emit LogStake(msg.sender, _amount);
    }

    function unstake(uint256 _amount) external whenNotPaused {
        require(staker[msg.sender].amount >= _amount, "Insufficient unstake");
        staker[msg.sender].stakeRewards = getTotalRewards(msg.sender);
        staker[msg.sender].startTime = block.timestamp;
        staker[msg.sender].amount -= _amount;
        stakeToken.transferFrom(TREASURY, msg.sender, _amount);
        emit LogUnstake(msg.sender, _amount);
    }

    function withdrawRewards() external whenNotPaused {
        uint256 toWithdraw = getTotalRewards(msg.sender);

        require(toWithdraw > 0, "Insufficient rewards balance");

        staker[msg.sender].stakeRewards = 0;

        staker[msg.sender].startTime = block.timestamp;
        
        rewardsToken.transferFrom(REWARD_WALLET, msg.sender, toWithdraw);
        emit LogRewardsWithdrawal(msg.sender, toWithdraw);
    }

    function getDeltaTime(address _staker) public view returns (uint256) {
        return block.timestamp - staker[_staker].startTime;
    }

    function getTotalRewards(address _staker) public view returns (uint256) {
        uint256 newRewards = 0;
        if (staker[_staker].amount > 0) {
            if (
                block.timestamp > rewardRateUpdatedTime &&
                staker[_staker].startTime < rewardRateUpdatedTime
            ) {
                uint256 time1 = rewardRateUpdatedTime - staker[_staker].startTime;
                uint256 timeRate1 = (time1 * 10**18) / oldRewardRate;

                uint256 time2 = block.timestamp - rewardRateUpdatedTime;
                uint256 timeRate2 = (time2 * 10**18) / rewardRate;

                newRewards = (staker[_staker].amount * (timeRate1 + timeRate2)) /
                    10**18;
            } else {
                uint256 time = getDeltaTime(_staker) * 10**18;
                uint256 timeRate = time / rewardRate;
                newRewards = (staker[_staker].amount * timeRate) / 10**18;
            }
        }
        return newRewards + staker[_staker].stakeRewards;
    }

    function setRewardRate(uint256 _rewardRate) external onlyOwner {
        rewardRateUpdatedTime = block.timestamp;
        oldRewardRate = rewardRate;
        rewardRate = _rewardRate;
        emit LogSetRewardRate(rewardRate);
    }

    function setTreasury(address _tresuary) external onlyOwner {
        TREASURY = _tresuary;
        emit LogSetTreasury(TREASURY);
    }

    function setRewardWallet(address _rewardWallet) external onlyOwner {
        REWARD_WALLET = _rewardWallet;
        emit LogSetRewardWallet(REWARD_WALLET);
    }
    
    function setPause() external onlyOwner {
        _pause();
    }

    function setUnpause() external onlyOwner {
        _unpause();
    }

    receive() external payable {
        emit LogReceived(_msgSender(), msg.value);
    }

    fallback() external payable { 
        emit LogFallback(_msgSender(), msg.value);
    }

    function getRewardRate() external view returns (uint256) {
        return rewardRate;
    }

    function withdrawBNB(address payable account, uint256 amount) external onlyOwner {
        require(amount <= (address(this)).balance, "Incufficient funds");
        account.transfer(amount);
        emit LogWithdrawalBNB(account, amount);
    }

    /**
     * @notice Should not be withdrawn scam token.
     */
    function withdrawToken(IERC20 token, address account, uint256 amount) external onlyOwner {
        require(amount <= token.balanceOf(account), "Incufficient funds");
        require(token.transfer(account, amount), "Transfer Fail");

        emit LogWithdrawToken(address(token), account, amount);
    }
}
