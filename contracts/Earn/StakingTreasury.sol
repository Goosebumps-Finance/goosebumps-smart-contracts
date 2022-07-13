//SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import "../utils/Ownable.sol";
import "../interfaces/IERC20.sol";
import "../interfaces/IReflectionsDistributor.sol";

contract StakingTreasury is Ownable {
    address public stakingVault;
    uint256 public totalStakedBalance;
    uint256 public minAmountReflection = 1000 * 10**9;

    IReflectionsDistributor public reflectionsDistributor;
    IERC20 public stakeToken;

    event LogDeposit(address user, uint256 amount);
    event LogWithdrawal(address user, uint256 amount);
    event LogSetStakingVault(address stakingVault);
    event LogSetStakeToken(address indexed stakeToken);
    event LogSetMinAmountReflection(uint256 minAmountReflection);
    event LogSetReflectionsDistributor(address reflectionsDistributor);

    constructor(
        address _stakingVault,
        IERC20 _stakeToken,
        IReflectionsDistributor _reflectionsDistributor
    ) {
        require(
            _stakingVault != address(0) && 
            address(_stakeToken) != address(0) && 
            address(_reflectionsDistributor) != address(0), 
            "ZERO_ADDRESS"
        );
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
        if (reflections >= minAmountReflection) {
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

        require(
            stakeToken.transferFrom(staker, address(this), amount),
            "TransferFrom fail"
        );
        totalStakedBalance += amount;

        reflectionsDistributor.deposit(staker, amount);

        emit LogDeposit(staker, amount);
    }

    function withdraw(address staker, uint256 amount)
        external
        onlyStakingVault
    {
        transferReflections();

        require(stakeToken.transfer(staker, amount), "Transfer fail");
        totalStakedBalance -= amount;

        reflectionsDistributor.withdraw(staker, amount);
        emit LogWithdrawal(staker, amount);
    }

    function setStakingVault(address _stakingVault) external onlyMultiSig {
        require(_stakingVault != address(0), "ZERO_ADDRESS");
        require(_stakingVault != address(stakingVault), "SAME_ADDRESS");
        stakingVault = _stakingVault;
        emit LogSetStakingVault(stakingVault);
    }

    function setStakeToken(address _stakeToken) external onlyMultiSig {
        require(_stakeToken != address(0), "ZERO_ADDRESS");
        require(_stakeToken != address(stakeToken), "SAME_ADDRESS");
        stakeToken = IERC20(_stakeToken);

        emit LogSetStakeToken(_stakeToken);
    }

    function setMinAmountReflection(uint256 _minAmountReflection)
        external
        onlyMultiSig
    {
        require(minAmountReflection != _minAmountReflection, "SAME_VALUE");
        minAmountReflection = _minAmountReflection;
        emit LogSetMinAmountReflection(minAmountReflection);
    }

    function setReflectionsDistributor(
        IReflectionsDistributor _reflectionsDistributor
    ) external onlyMultiSig {
        require(address(_reflectionsDistributor) != address(0), "ZERO_ADDRESS");
        require(address(_reflectionsDistributor) != address(reflectionsDistributor), "SAME_ADDRESS");
        reflectionsDistributor = _reflectionsDistributor;
        emit LogSetReflectionsDistributor(address(reflectionsDistributor));
    }
}
