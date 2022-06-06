// SPDX-License-Identifier: MIT

pragma solidity ^0.8.11;


import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ReflectionsDistributor is Ownable {
    using SafeMath for uint256;

    /// @notice Info of each user 
    struct UserInfo {
        uint256 amount;
        uint256 rewardDebt;
        /**
         * @notice We do some fancy math here. Basically, any point in time, the amount of EMPIREs
         * entitled to a user but is pending to be distributed is:
         *
         *   pending reward = (user.amount * accRewardPerShare) - user.rewardDebt
         *
         * Whenever a user deposits or withdraws EMPIRE. Here's what happens:
         *   1. accRewardPerShare (and `lastRewardBalance`) gets updated
         *   2. User receives the pending reward sent to his/her address
         *   3. User's `amount` gets updated
         *   4. User's `rewardDebt` gets updated
         */
    }

    IERC20 public empire;

    /// @dev Internal balance of EMPIRE, this gets updated on user deposits / withdrawals
    /// this allows to reward users with EMPIRE
    uint256 public internalEmpireBalance;

    /// @notice Last reward balance 
    uint256 public lastRewardBalance;

    /// @notice Accumulated rewards per share, scaled to `ACC_REWARD_PER_SHARE_PRECISION`
    uint256 public accRewardPerShare;

    /// @notice The precision of `accRewardPerShare`
    uint256 public ACC_REWARD_PER_SHARE_PRECISION;

    /// @dev Info of each user that stakes EMPIRE
    mapping(address => UserInfo) private userInfo;

    /// @notice Emitted when a user deposits EMPIRE
    event Deposit(address indexed user, uint256 amount);

    /// @notice Emitted when a user withdraws EMPIRE
    event Withdraw(address indexed user, uint256 amount);

    /// @notice Emitted when a user claims reward
    event ClaimReward(address indexed user, uint256 amount);

    /// @notice Emitted when a user emergency withdraws its EMPIRE
    event EmergencyWithdraw(address indexed user, uint256 amount);



    /**
     * @param _empire The address of the EMPIRE token
     */
    constructor(IERC20 _empire) {
        require(address(_empire) != address(0), "EMPIREStaking: Empire can't be address(0)");
        
        empire = _empire;

        ACC_REWARD_PER_SHARE_PRECISION = 1e24;
    }

    /**
     * @notice Deposit EMPIRE for reward token allocation
     * @param _amount The amount of EMPIRE to deposit
     */
    function deposit(address _user, uint256 _amount) external {
        UserInfo storage user = userInfo[_user];

        uint256 _previousAmount = user.amount;
        uint256 _newAmount = user.amount.add(_amount);
        user.amount = _newAmount;

        updateReward();
        uint256 _previousRewardDebt = user.rewardDebt;
        user.rewardDebt = _newAmount.mul(accRewardPerShare).div(ACC_REWARD_PER_SHARE_PRECISION);
        if (_previousAmount != 0) {
            uint256 _pending = _previousAmount
                .mul(accRewardPerShare)
                .div(ACC_REWARD_PER_SHARE_PRECISION)
                .sub(_previousRewardDebt);
            if (_pending != 0) {
                safeTokenTransfer(_user, _pending);
                emit ClaimReward(_user, _pending);
            }
        }
    

        internalEmpireBalance = internalEmpireBalance.add(_amount);
        emit Deposit(_user, _amount);
    }

    /**
     * @notice Get user info
     * @param _user The address of the user
     * @return The amount of EMPIRE user has deposited
     * @return The reward debt for the chosen token
     */
    function getUserInfo(address _user) external view returns (uint256, uint256) {
        UserInfo storage user = userInfo[_user];
        return (user.amount, user.rewardDebt);
    }


    /**
     * @notice View function to see pending reward token on frontend
     * @param _user The address of the user
     * @return `_user`'s pending reward token
     */
    function pendingReward(address _user) external view returns (uint256) {

        UserInfo storage user = userInfo[_user];
        uint256 _totalEmpire = internalEmpireBalance;
        uint256 _accRewardTokenPerShare = accRewardPerShare;

        uint256 _currRewardBalance = empire.balanceOf(address(this));
        uint256 _rewardBalance = _currRewardBalance;

        if (_rewardBalance != lastRewardBalance && _totalEmpire != 0) {
            uint256 _accruedReward = _rewardBalance.sub(lastRewardBalance);
            _accRewardTokenPerShare = _accRewardTokenPerShare.add(
                _accruedReward.mul(ACC_REWARD_PER_SHARE_PRECISION).div(_totalEmpire)
            );
        }
        return
            user.amount.mul(_accRewardTokenPerShare).div(ACC_REWARD_PER_SHARE_PRECISION).sub(user.rewardDebt);
    }

    /**
     * @notice Withdraw EMPIRE and harvest the rewards
     * @param _amount The amount of EMPIRE to withdraw
     */
    function withdraw(address _user, uint256 _amount) external {
        UserInfo storage user = userInfo[_user];
        uint256 _previousAmount = user.amount;
        require(_amount <= _previousAmount, "ReflectionsDistributor: withdraw amount exceeds balance");
        uint256 _newAmount = user.amount.sub(_amount);
        user.amount = _newAmount;

    
        if (_previousAmount != 0) { 
            updateReward();   
            uint256 _pending = _previousAmount
                .mul(accRewardPerShare)
                .div(ACC_REWARD_PER_SHARE_PRECISION)
                .sub(user.rewardDebt);
            user.rewardDebt = _newAmount.mul(accRewardPerShare).div(ACC_REWARD_PER_SHARE_PRECISION) ;  
            if (_pending != 0) {
                safeTokenTransfer(_user, _pending);
                emit ClaimReward(_user, _pending);
            }
        }

        internalEmpireBalance = internalEmpireBalance.sub(_amount);
        
        emit Withdraw(_user, _amount);
    }

    /**
     * @notice Update reward variables
     * @dev Needs to be called before any deposit or withdrawal
     */
    function updateReward() public {
        

        uint256 _totalEmpire = internalEmpireBalance;

        uint256 _currRewardBalance = empire.balanceOf(address(this));
        uint256 _rewardBalance = _currRewardBalance;
    

        // Did ReflectionsDistributor receive any token
        if (_rewardBalance == lastRewardBalance || _totalEmpire == 0) {
            return;
        }

        uint256 _accruedReward = _rewardBalance.sub(lastRewardBalance);

        accRewardPerShare = accRewardPerShare.add(
            _accruedReward.mul(ACC_REWARD_PER_SHARE_PRECISION).div(_totalEmpire)
        );
        lastRewardBalance = _rewardBalance;
    }

    /**
     * @notice Safe token transfer function, just in case if rounding error
     * causes pool to not have enough reward tokens
     * @param _to The address that will receive `_amount` `rewardToken`
     * @param _amount The amount to send to `_to`
     */
    function safeTokenTransfer(
        address _to,
        uint256 _amount
    ) internal {
        uint256 _currRewardBalance = empire.balanceOf(address(this));
        uint256 _rewardBalance = _currRewardBalance;

        if (_amount > _rewardBalance) {
            lastRewardBalance = lastRewardBalance.sub(_rewardBalance);
            empire.transfer(_to, _rewardBalance);
        } else {
            lastRewardBalance = lastRewardBalance.sub(_amount);
            empire.transfer(_to, _amount);
        }
    }
}