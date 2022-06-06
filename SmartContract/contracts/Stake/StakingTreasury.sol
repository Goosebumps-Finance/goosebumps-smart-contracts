//SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IStakingTresuary.sol";
import "./interfaces/IReflectionsDistributor.sol";

contract StakingTresuary is Ownable, IStakingTresuary {
    address public stakingVault;
    uint256 public minAmountReflection = 1000 * 10**9;
    address public reflectionsDistributorAddress;
    uint256 public totalStakedBalance;

    IERC20 public stakeToken;
    IReflectionsDistributor public reflectionsDistributor;

    event LogDeposit(address user, uint256 amount);
    event LogWithdrawal(address user, uint256 amount);
    event LogSetStakingVault(address stakingVault);
    event LogSetStakeToken(address stakeToken);
    event LogSetMinAmountReflection(uint256 minAmountReflection);
    event LogSetReflectionsDistributor(address reflectionsDistributor);
    event LogReceived(address indexed, uint256);
    event LogFallback(address indexed, uint256);
    event LogWithdrawalETH(address indexed recipient, uint256 amount);
    event LogWithdrawToken(
        address indexed token,
        address indexed recipient,
        uint256 amount
    );

    /**
     * @dev Throws if called by any account other than the owner or deployer.
     */
    modifier onlyStakingVault() {
        require(
            _msgSender() == stakingVault,
            "StakingTresuary: caller is not the stakingVault"
        );
        _;
    }

    constructor(
        address _stakingVault,
        IERC20 _stakeToken,
        IReflectionsDistributor _reflectionsDistributor
    ) {
        stakeToken = _stakeToken;
        stakingVault = _stakingVault;
        reflectionsDistributor = _reflectionsDistributor;
    }

    function deposit(address staker, uint256 amount) external onlyStakingVault {
        require(
            stakeToken.allowance(staker, address(this)) >= amount,
            "Insufficient allowance."
        );

        uint256 contractBalance = getTotalStakedBalance();
        uint256 contractBalanceWReflections = stakeToken.balanceOf(
            address(this)
        );
        uint256 reflections = contractBalanceWReflections - contractBalance;

        /**
         * @notice Transfers accumulated reflections to the reflectionsDistributor
         * if the amount is reached
         */
        if (
            contractBalanceWReflections > 0 && reflections > minAmountReflection
        ) {
            stakeToken.transfer(reflectionsDistributorAddress, reflections);
        }

        totalStakedBalance += amount;

        reflectionsDistributor.deposit(staker, amount);
        stakeToken.transferFrom(staker, address(this), amount);
        emit LogDeposit(staker, amount);
    }

    function withdraw(address staker, uint256 amount)
        external
        onlyStakingVault
    {
        totalStakedBalance -= amount;
        stakeToken.transfer(staker, amount);

        uint256 contractBalance = getTotalStakedBalance();
        uint256 contractBalanceWReflections = stakeToken.balanceOf(
            address(this)
        );

        /**
         * @notice Transfers accumulated reflections to the reflectionsDistributor
         * if the amount is reached
         */
        if (
            contractBalanceWReflections - contractBalance >= minAmountReflection
        ) {
            stakeToken.transfer(
                reflectionsDistributorAddress,
                minAmountReflection
            );
        }

        reflectionsDistributor.withdraw(staker, amount);
        emit LogWithdrawal(staker, amount);
    }

    function getTotalStakedBalance() public view returns (uint256) {
        return totalStakedBalance;
    }

    function setStakingVault(address _stakingVault) external onlyOwner {
        stakingVault = _stakingVault;
        emit LogSetStakingVault(stakingVault);
    }

    function setStakeToken(IERC20 _stakeToken) external onlyOwner {
        stakeToken = _stakeToken;
        emit LogSetStakeToken(address(stakeToken));
    }

    function setMinAmountReflection(uint256 _minAmountReflection)
        external
        onlyOwner
    {
        minAmountReflection = _minAmountReflection;
        emit LogSetMinAmountReflection(minAmountReflection);
    }

    function setReflectionsDistributor(
        IReflectionsDistributor _reflectionsDistributor
    ) external onlyOwner {
        reflectionsDistributor = _reflectionsDistributor;
        emit LogSetReflectionsDistributor(address(reflectionsDistributor));
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
        require(amount <= (address(this)).balance, "INSUFFICIENT_FUNDS");
        (bool success, ) = recipient.call{value: amount}(new bytes(0));
        require(success, "ETH_TRANSFER_FAILED");
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
        require(amount <= token.balanceOf(address(this)), "INSUFFICIENT_FUNDS");
        require(token.transfer(recipient, amount), "TRANSFER_FAILED");

        emit LogWithdrawToken(address(token), recipient, amount);
    }
}
