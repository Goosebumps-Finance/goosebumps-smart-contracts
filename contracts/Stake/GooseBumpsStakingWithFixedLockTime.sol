// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract GooseBumpsStakingWithFixedLockTime is Ownable, Pausable {
    struct StakerInfo {
        uint256 amount;
        uint256 endTime;
        uint256 startBlock;
        uint256 stakeRewards;
    }

    // Staker Info
    mapping(address => StakerInfo) public staker;

    uint256 public immutable rewardPerBlockTokenN;
    uint256 public immutable rewardPerBlockTokenD; // Must be greater than zero

    IERC20 public immutable stakeToken;
    IERC20 public immutable rewardsToken;

    uint256 public lockTime = 30 days;

    address public TREASURY;
    address public REWARD_WALLET;

    event LogStake(address indexed from, uint256 amount);
    event LogUnstake(
        address indexed from,
        uint256 amount,
        uint256 amountRewards
    );
    event LogRewardsWithdrawal(address indexed to, uint256 amount);
    event LogSetTreasury(address indexed newTreasury);
    event LogSetRewardWallet(address indexed newRewardWallet);
    event LogSetLockTime(uint256 lockTime);

    constructor(
        IERC20 _stakeToken,
        IERC20 _rewardsToken,
        address _treasury,
        address _rewardWallet,
        uint256 _rewardPerBlockTokenN,
        uint256 _rewardPerBlockTokenD
    ) {
        stakeToken = _stakeToken;
        rewardsToken = _rewardsToken;
        TREASURY = _treasury;
        REWARD_WALLET = _rewardWallet;
        rewardPerBlockTokenN = _rewardPerBlockTokenN;
        rewardPerBlockTokenD = _rewardPerBlockTokenD;
    }

    function stake(uint256 _amount) external whenNotPaused {
        require(_amount > 0, "Staking amount must be greater than zero");

        require(
            stakeToken.balanceOf(msg.sender) >= _amount,
            "Insufficient stakeToken balance"
        );

        if (staker[msg.sender].amount > 0) {
            staker[msg.sender].stakeRewards = getTotalRewards(msg.sender);
        }

        require(
            stakeToken.transferFrom(msg.sender, TREASURY, _amount),
            "TransferFrom fail"
        );

        staker[msg.sender].amount += _amount;
        staker[msg.sender].startBlock = block.number;
        staker[msg.sender].endTime = block.timestamp + lockTime;
        emit LogStake(msg.sender, _amount);
    }

    function unstake(uint256 _amount) external whenNotPaused {
        require(
            block.timestamp > staker[msg.sender].endTime,
            "Can't unstake yet"
        );
        require(_amount > 0, "Unstaking amount must be greater than zero");
        require(staker[msg.sender].amount >= _amount, "Insufficient unstake");

        uint256 amountWithdraw = _withdrawRewards();
        staker[msg.sender].amount -= _amount;
        staker[msg.sender].startBlock = block.number;
        staker[msg.sender].stakeRewards = 0;

        require(
            stakeToken.transferFrom(TREASURY, msg.sender, _amount),
            "TransferFrom fail"
        );

        emit LogUnstake(msg.sender, _amount, amountWithdraw);
    }

    function _withdrawRewards() internal returns (uint256) {
        uint256 amountWithdraw = getTotalRewards(msg.sender);
        if (amountWithdraw > 0) {
            require(
                rewardsToken.transferFrom(
                    REWARD_WALLET,
                    msg.sender,
                    amountWithdraw
                ),
                "TransferFrom fail"
            );
        }
        return amountWithdraw;
    }

    function withdrawRewards() external whenNotPaused {
        uint256 amountWithdraw = _withdrawRewards();
        require(amountWithdraw > 0, "Insufficient rewards balance");
        staker[msg.sender].startBlock = block.number;
        staker[msg.sender].stakeRewards = 0;

        emit LogRewardsWithdrawal(msg.sender, amountWithdraw);
    }

    function getTotalRewards(address _staker) public view returns (uint256) {
        uint256 newRewards = ((block.number - staker[_staker].startBlock) *
            staker[_staker].amount *
            rewardPerBlockTokenN) / rewardPerBlockTokenD;
        return newRewards + staker[_staker].stakeRewards;
    }

    function setTreasury(address _tresuary) external onlyOwner {
        TREASURY = _tresuary;
        emit LogSetTreasury(TREASURY);
    }

    function setRewardWallet(address _rewardWallet) external onlyOwner {
        REWARD_WALLET = _rewardWallet;
        emit LogSetRewardWallet(REWARD_WALLET);
    }

    function setLockTime(uint256 _lockTime) external onlyOwner {
        lockTime = _lockTime;
        emit LogSetLockTime(lockTime);
    }

    function setPause() external onlyOwner {
        _pause();
    }

    function setUnpause() external onlyOwner {
        _unpause();
    }
}
