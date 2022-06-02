// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Token is ERC20, Ownable {
    event Mint(address indexed account, uint256 amount);
    event Burn(address indexed account, uint256 amount);

    constructor(string memory name_, string memory symbol_) ERC20 (name_, symbol_) {
        _mint(msg.sender, 10 ** (6 + 18)); // supply 1 million

        emit Mint(msg.sender, 10 ** (6 + 18));
    }

    function mint(address account, uint256 amount) external onlyOwner {
        require(amount != uint256(0), "mint: amount is zero");
        _mint(account, amount);

        emit Mint(account, amount);
    }

    function burn(address account, uint256 amount) external onlyOwner {
        require(amount != uint256(0), "burn: amount is zero");
        _burn(account, amount);

        emit Burn(account, amount);
    }
}