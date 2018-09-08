[![Build Status](https://travis-ci.org/nitika-goel/lockable-token.svg?branch=master)](https://travis-ci.org/nitika-goel/lockable-token) [![Coverage Status](https://coveralls.io/repos/github/nitika-goel/lockable-token/badge.svg?branch=master)](https://coveralls.io/github/nitika-goel/lockable-token?branch=master)

This is a sample contract showcasing the implementation of https://github.com/ethereum/EIPs/issues/1132

## Summary
An extension to the ERC20 standard with methods for time-locking of tokens within a contract. This contract provides basic functionality to time-lock tokens within a contract for multiple utilities without the need of transferring tokens. It also allows fetching token balances of locked and unlocked tokens (tokens available for transfer).

I’ve extended the ERC20 interface with the following enhancements:

### Locking of tokens
```
/**
  * @dev Locks a specified amount of tokens against an address,
  *      for a specified reason and time
  * @param _reason The reason to lock tokens
  * @param _amount Number of tokens to be locked
  * @param _time Lock time in seconds
  */
function lock(bytes32 _reason, uint256 _amount, uint256 _time) public returns (bool)
```

### Fetching number of tokens locked under each utility
```
/**
  * @dev Returns tokens locked for a specified address for a
  *      specified reason
  *
  * @param _of The address whose tokens are locked
  * @param _reason The reason to query the lock tokens for
  */
   tokensLocked(address _of, bytes32 _reason) view returns (uint256 amount)
```

### Fetching number of tokens locked under each utility at a future timestamp
```
/**
  * @dev Returns tokens locked for a specified address for a
  *      specified reason at a specific time
  *
  * @param _of The address whose tokens are locked
  * @param _reason The reason to query the lock tokens for
  * @param _time The timestamp to query the lock tokens for
  */
  function tokensLockedAtTime(address _of, bytes32 _reason, uint256 _time) public view returns (uint256 amount)
```

### Fetching number of tokens held by an address
```
/**
  * @dev @dev Returns total tokens held by an address (locked + transferable)
  * @param _of The address to query the total balance of
  */
function totalBalanceOf(address _of)  view returns (uint256 amount)
```

### Extending lock period
```
/**
  * @dev Extends lock for a specified reason and time
  * @param _reason The reason to lock tokens
  * @param _time Lock extension time in seconds
  */
  function extendLock(bytes32 _reason, uint256 _time) public returns (bool)
```

### Increasing number of tokens locked
```
/**
  * @dev Increase number of tokens locked for a specified reason
  * @param _reason The reason to lock tokens
  * @param _amount Number of tokens to be increased
  */
  function increaseLockAmount(bytes32 _reason, uint256 _amount) public returns (bool)
```
### Fetching number of unlockable tokens under each utility
```
/**
  * @dev Returns unlockable tokens for a specified address for a specified reason
  * @param _of The address to query the the unlockable token count of
  * @param _reason The reason to query the unlockable tokens for
  */
  function tokensUnlockable(address _of, bytes32 _reason) public view returns (uint256 amount)
 ```    
### Fetching number of unlockable tokens
```
/**
  * @dev Gets the unlockable tokens of a specified address
  * @param _of The address to query the the unlockable token count of
  */
  function getUnlockableTokens(address _of) public view returns (uint256 unlockableTokens)
```
### Unlocking tokens
```
/**
  * @dev Unlocks the unlockable tokens of a specified address
  * @param _of Address of user, claiming back unlockable tokens
  */
  function unlock(address _of) public returns (uint256 unlockableTokens)
```


### Lock event recorded in the token contract
`event Locked(address indexed _of, uint256 indexed _reason, uint256 _amount, uint256 _validity)`

### Unlock event recorded in the token contract
`event Unlocked(address indexed _of, uint256 indexed _reason, uint256 _amount)`


## Development

The smart contracts are implemented using Solidity `0.4.24`.

### Development Prerequisites

* [NodeJS](htps://nodejs.org), version 10+ or better (I use [`nvm`](https://github.com/creationix/nvm) to manage Node versions — `brew install nvm`.)
* [truffle](http://truffleframework.com/), which is a comprehensive framework for Ethereum development. `npm install -g truffle` — this should install Truffle v4.1.11 or better.  Check that with `truffle version`.

### Initialisation

    npm install

### Testing

#### Standalone

    npm test

or with code coverage

    npm run test:cov

#### From within Truffle

Run the `truffle` development environment

    truffle develop

then from the prompt you can run

    compile
    migrate
    test

as well as other Truffle commands. See [truffleframework.com](http://truffleframework.com) for more.

### Linting

You can use the following linting options

* `npm run lint:sol` — to lint the Solidity files, and
* `npm run lint:js` — to lint the Javascript.

## Contributing

Please see the [contributing notes](CONTRIBUTING.md).
