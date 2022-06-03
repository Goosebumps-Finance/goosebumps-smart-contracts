// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract GooseBumpsFarming is Ownable, Pausable {
    struct StakerInfo {
        uint256 amount;
        uint256 startTime;
        uint256 farmRewards;
    }

    // Farmer Info
    mapping(address => StakerInfo) public staker;

    uint256 public rewardRatePerSecondPerToken = 86400;
    uint256 public oldRewardRate = rewardRatePerSecondPerToken;
    uint256 public rewardRateUpdatedTime = block.timestamp;

    address public TREASURY;
    address public REWARD_WALLET;

    IERC20 public lpToken;
    IERC20 public rewardsToken;

    event LogStake(address indexed from, uint256 amount);
    event LogUnstake(address indexed from, uint256 amount);
    event LogRewardsWithdrawal(address indexed to, uint256 amount);
    event LogSetRewardRate(uint256 rewardRatePerSecondPerToken);
    event LogSetTreasury(address indexed newTreasury);
    event LogSetRewardWallet(address indexed newRewardWallet);
    event LogSetLpToken(address lpToken);
    event LogSetRewardsToken(address rewardsToken);
    event LogReceived(address indexed, uint256);
    event LogFallback(address indexed, uint256);
    event LogWithdrawalETH(address indexed recipient, uint256 amount);
    event LogWithdrawToken(
        address indexed token,
        address indexed recipient,
        uint256 amount
    );

    constructor(
        IERC20 _lpToken,
        IERC20 _rewardsToken,
        address _treasury,
        address _rewardWallet
    ) {
        lpToken = _lpToken;
        rewardsToken = _rewardsToken;
        TREASURY = _treasury;
        REWARD_WALLET = _rewardWallet;
    }

    function stake(uint256 _amount) external whenNotPaused {
        require(
            _amount > 0 && lpToken.balanceOf(msg.sender) >= _amount,
            "Insufficient lpToken balance"
        );

        if (staker[msg.sender].amount > 0) {
            staker[msg.sender].farmRewards = getTotalRewards(msg.sender);
        }

        lpToken.transferFrom(msg.sender, TREASURY, _amount);
        staker[msg.sender].amount += _amount;
        staker[msg.sender].startTime = block.timestamp;
        emit LogStake(msg.sender, _amount);
    }

    function unstake(uint256 _amount) external whenNotPaused {
        require(staker[msg.sender].amount >= _amount, "Insufficient unstake");
        staker[msg.sender].farmRewards = getTotalRewards(msg.sender);
        staker[msg.sender].startTime = block.timestamp;
        staker[msg.sender].amount -= _amount;
        lpToken.transferFrom(TREASURY, msg.sender, _amount);
        emit LogUnstake(msg.sender, _amount);
    }

    function withdrawRewards() external whenNotPaused {
        uint256 toWithdraw = getTotalRewards(msg.sender);
        require(toWithdraw > 0, "Insufficient rewards balance");
        staker[msg.sender].farmRewards = 0;
        staker[msg.sender].startTime = block.timestamp;
        rewardsToken.transferFrom(REWARD_WALLET, msg.sender, toWithdraw);
        emit LogRewardsWithdrawal(msg.sender, toWithdraw);
    }

    function getTotalRewards(address _staker) public view returns (uint256) {
        uint256 newRewards = 0;
        if (staker[_staker].amount > 0) {
            if (
                block.timestamp > rewardRateUpdatedTime &&
                staker[_staker].startTime < rewardRateUpdatedTime
            ) {
                uint256 time1 = rewardRateUpdatedTime -
                    staker[_staker].startTime;
                uint256 timeRate1 = (time1 * 10**18) / oldRewardRate;

                uint256 time2 = block.timestamp - rewardRateUpdatedTime;
                uint256 timeRate2 = (time2 * 10**18) /
                    rewardRatePerSecondPerToken;

                newRewards =
                    (staker[_staker].amount * (timeRate1 + timeRate2)) /
                    10**18;
            } else {
                uint256 time = block.timestamp - staker[_staker].startTime;
                uint256 timeRate = (time * 10**18) /
                    rewardRatePerSecondPerToken;
                newRewards = (staker[_staker].amount * timeRate) / 10**18;
            }
        }
        return newRewards + staker[_staker].farmRewards;
    }

    function setRewardRate(uint256 _rewardRate) external onlyOwner {
        rewardRateUpdatedTime = block.timestamp;
        oldRewardRate = rewardRatePerSecondPerToken;
        rewardRatePerSecondPerToken = _rewardRate;
        emit LogSetRewardRate(rewardRatePerSecondPerToken);
    }

    function setTreasury(address _tresuary) external onlyOwner {
        TREASURY = _tresuary;
        emit LogSetTreasury(TREASURY);
    }

    function setRewardWallet(address _rewardWallet) external onlyOwner {
        REWARD_WALLET = _rewardWallet;
        emit LogSetRewardWallet(REWARD_WALLET);
    }

    function setLpToken(IERC20 _lpToken) external onlyOwner {
        lpToken = _lpToken;
        emit LogSetLpToken(address(lpToken));
    }

    function setRewardsToken(IERC20 _rewardsToken) external onlyOwner {
        rewardsToken = _rewardsToken;
        emit LogSetRewardsToken(address(rewardsToken));
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

    function withdrawETH(address payable recipient, uint256 amount)
        external
        onlyOwner
    {
        require(amount <= (address(this)).balance, "Insufficient funds");
        recipient.transfer(amount);
        emit LogWithdrawalETH(recipient, amount);
    }

    /**
     * @notice  Should not be withdrawn scam token.
     */
    function withdrawToken(
        IERC20 token,
        address recipient,
        uint256 amount
    ) external onlyOwner {
        require(amount <= token.balanceOf(address(this)), "Insufficient funds");
        require(token.transfer(recipient, amount), "Transfer Fail");

        emit LogWithdrawToken(address(token), recipient, amount);
    }
}
