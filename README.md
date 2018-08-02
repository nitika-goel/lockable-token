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
  * @dev Returns tokens locked for a specified address, purpose and time
  * @param _of The address to query the lock tokens of
  * @param _reason The reason to query the lock tokens for
  * @param _time The timestamp to query the lock tokens for
  **/
   function tokensLocked(address _of, bytes32 _reason, uint256 _time) view returns (uint256 amount)
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
### Lock event recorded in the token contract
`event Lock(address indexed _of, uint256 indexed _reason, uint256 _amount, uint256 _validity)`


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
