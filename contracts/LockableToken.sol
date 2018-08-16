pragma solidity ^0.4.24;

import './ERC1132.sol';

contract LockableToken is ERC1132 {
    
    constructor(uint256 _supply) public {
        totalSupply_ = _supply;
        balances[msg.sender] = _supply;
    }
}
