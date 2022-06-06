//SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IReflectionsDistributor.sol";

contract StakingTreasury is Ownable {
    address public stakingVault;
    uint256 public totalStakedBalance;
    uint256 public minAmountReflection = 1000 * 10**9;

    IReflectionsDistributor public reflectionsDistributor;
    IERC20 public immutable stakeToken;

    event LogDeposit(address user, uint256 amount);
    event LogWithdrawal(address user, uint256 amount);
    event LogSetStakingVault(address stakingVault);
    event LogSetMinAmountReflection(uint256 minAmountReflection);
    event LogSetReflectionsDistributor(address reflectionsDistributor);

    constructor(
        address _stakingVault,
        IERC20 _stakeToken,
        IReflectionsDistributor _reflectionsDistributor
    ) {
        stakeToken = _stakeToken;
        stakingVault = _stakingVault;
        reflectionsDistributor = _reflectionsDistributor;
    }

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

    function transferReflections() internal {
        uint256 reflections = stakeToken.balanceOf(address(this)) -
            totalStakedBalance;

        /**
         * @notice Transfers accumulated reflections to the reflectionsDistributor
         * if the amount is reached
         */
        if (reflections > minAmountReflection) {
            require(
                stakeToken.transfer(
                    address(reflectionsDistributor),
                    reflections
                ),
                "Transfer fail"
            );
        }
    }

    function deposit(address staker, uint256 amount) external onlyStakingVault {
        transferReflections();

        totalStakedBalance += amount;

        reflectionsDistributor.deposit(staker, amount);
        require(
            stakeToken.transferFrom(staker, address(this), amount),
            "TransferFrom fail"
        );
        emit LogDeposit(staker, amount);
    }

    function withdraw(address staker, uint256 amount)
        external
        onlyStakingVault
    {
        transferReflections();

        totalStakedBalance -= amount;
        require(stakeToken.transfer(staker, amount), "Transfer fail");

        reflectionsDistributor.withdraw(staker, amount);
        emit LogWithdrawal(staker, amount);
    }

    function setStakingVault(address _stakingVault) external onlyOwner {
        stakingVault = _stakingVault;
        emit LogSetStakingVault(stakingVault);
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
}
