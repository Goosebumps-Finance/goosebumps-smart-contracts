// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

interface IReflectionsDistributor {
    function deposit(address _user, uint256 _amount, uint256 _userAmount) external;

    function withdraw(address _user, uint256 _amount, uint256 _userAmount) external;
}
