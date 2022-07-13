// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "../interfaces/IERC20.sol";
import "../utils/Ownable.sol";
import "../utils/Pausable.sol";

contract GoosebumpsStakingWithFixedLockTime is Ownable, Pausable {
    struct StakerInfo {
        uint256 amount;
        uint256 endTime;
        uint256 startBlock;
        uint256 stakeRewards;
    }

    // Staker Info
    mapping(address => StakerInfo) public staker;

    uint256 public rewardPerBlockTokenN;
    uint256 public rewardPerBlockTokenD; // Must be greater than zero

    IERC20 public stakeToken;
    IERC20 public rewardsToken;

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
    event LogSetRewardsToken(address indexed rewardsToken);
    event LogSetStakeToken(address indexed stakeToken);
    event LogSetRewardPerBlockToken(uint256 rewardPerBlockTokenN, uint256 rewardPerBlockTokenD);

    constructor(
        IERC20 _stakeToken,
        IERC20 _rewardsToken,
        address _treasury,
        address _rewardWallet,
        uint256 _rewardPerBlockTokenN,
        uint256 _rewardPerBlockTokenD
    ) {
        require(
            address(_stakeToken) != address(0) && 
            address(_rewardsToken) != address(0) && 
            _treasury != address(0) && 
            _rewardWallet != address(0), 
            "ZERO_ADDRESS"
        );
        require(_rewardPerBlockTokenD != 0, "ZERO_VALUE");
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

    function setTreasury(address _treasury) external onlyMultiSig {
        require(address(0) != _treasury, "ZERO_ADDRESS");
        require(TREASURY != _treasury, "SAME_ADDRESS");
        TREASURY = _treasury;
        emit LogSetTreasury(TREASURY);
    }

    function setRewardWallet(address _rewardWallet) external onlyMultiSig {
        require(address(0) != _rewardWallet, "ZERO_ADDRESS");
        require(REWARD_WALLET != _rewardWallet, "SAME_ADDRESS");
        REWARD_WALLET = _rewardWallet;
        emit LogSetRewardWallet(REWARD_WALLET);
    }

    function setLockTime(uint256 _lockTime) external onlyMultiSig {
        require(lockTime != _lockTime, "SAME_VALUE");
        lockTime = _lockTime;
        emit LogSetLockTime(lockTime);
    }

    function setRewardPerBlockToken(uint256 _rewardPerBlockTokenN, uint256 _rewardPerBlockTokenD) external onlyMultiSig {
        require(_rewardPerBlockTokenD != 0, "ZERO_VALUE");
        require(!(rewardPerBlockTokenN == _rewardPerBlockTokenN && rewardPerBlockTokenD == _rewardPerBlockTokenD), "SAME_VALUE");
        rewardPerBlockTokenN = _rewardPerBlockTokenN;
        rewardPerBlockTokenD = _rewardPerBlockTokenD;

        emit LogSetRewardPerBlockToken(rewardPerBlockTokenN, rewardPerBlockTokenD);
    }

    function setStakeToken(address _stakeToken) external onlyMultiSig {
        require(_stakeToken != address(0), "ZERO_ADDRESS");
        require(_stakeToken != address(stakeToken), "SAME_ADDRESS");
        stakeToken = IERC20(_stakeToken);

        emit LogSetStakeToken(_stakeToken);
    }

    function setRewardsToken(address _rewardsToken) external onlyMultiSig {
        require(_rewardsToken != address(0), "ZERO_ADDRESS");
        require(_rewardsToken != address(rewardsToken), "SAME_ADDRESS");
        rewardsToken = IERC20(_rewardsToken);
        
        emit LogSetRewardsToken(_rewardsToken);
    }

    function setPause() external onlyMultiSig {
        _pause();
    }

    function setUnpause() external onlyMultiSig {
        _unpause();
    }
}
