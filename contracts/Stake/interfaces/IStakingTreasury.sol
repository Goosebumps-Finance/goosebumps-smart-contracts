// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

interface IStakingTreasury {
    function deposit(address staker, uint256 amount) external;

    function withdraw(address staker, uint256 amount) external;
}
