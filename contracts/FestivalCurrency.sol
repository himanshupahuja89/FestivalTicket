// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FestivalCurrency is ERC20, Ownable {
    // Constructor function to initialize the ERC20 token with a name and symbol
    constructor() ERC20("FestivalCurrency", "FCC") {}
    
    // mint function to create new tokens
    // The function is only accessible by the owner of the contract (onlyOwner modifier)
    // Parameters:
    //  - 'to': the address that will receive the minted tokens
    //  - 'amount': the amount of tokens to mint
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
