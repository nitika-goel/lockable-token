This is a sample contract showcasing the implementation of https://github.com/ethereum/EIPs/issues/1132

## Summary
An extension to the ERC20 standard with methods for time-locking of tokens within a contract. This contract provides basic functionality to time-lock tokens within a contract for multiple utilities without the need of transferring tokens. It also allows fetching token balances of locked and unlocked tokens (tokens available for transfer).

I’ve extended the ERC20 interface with the following enhancements:

### Locking of tokens
```
/**
 * @dev Locks a specified amount of tokens against an address, for a specified purpose and time
 * @param _for The purpose of token locking, one application can have more than one utility
 * @param _amount Number of tokens to be locked
 * @param _time Lock time in seconds
 */
function lock(uint256 _for,uint256 _amount,uint256 _time)
```

### Fetching number of tokens locked under each utility
```
/**
   * @dev Returns tokens locked for a specified address, purpose and time
   * @param _of The address to query the lock tokens of
   * @param _for The purpose to query the lock tokens for
   * @param _time The timestamp to query the lock tokens for
   **/
   function tokensLocked(address _of,uint256 _for,uint256 _time) view returns (uint256 amount)
```
### Fetching number of tokens available for transfer
```
/**
   * @dev Returns tokens available for transfer for a specified address
   * @param _of The address to query the transferable balance of    
   **/
function transferableBalanceOf(address _of)  view returns (uint256 amount)
```
### Lock event recorded in the token contract
`event Lock(address indexed _of,uint256 indexed _for,uint256 _amount,uint256 _validity)`

If the above proposal is accepted, the functions `transfer() `and `transferFrom()` of the ERC20 interface should use `transferableBalanceOf()` instead of `balanceOf()` to check if the sender has enough tokens to transfer.

For example:

```
/**
 * @dev Transfer tokens from one address to another
 * @param _from address The address which you want to send tokens from
 * @param _to address The address which you want to transfer to
 * @param _value uint256 the amount of tokens to be transferred
 */
function transferFrom(address _from, address _to, uint256 _value)
    public
    returns (bool)
{
    require(_to != address(0));
    require(_value <= transferableBalanceOf(_from));
    require(_value <= allowed[_from][msg.sender]);

    balances[_from] = balances[_from].sub(_value);
    balances[_to] = balances[_to].add(_value);
    allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);
    emit Transfer(_from, _to, _value);
    return true;
}

/**
 * @dev transfer token for a specified address
 * @param _to The address to transfer to.
 * @param _value The amount to be transferred.
 */
 function transfer(address _to, uint256 _value) public returns (bool) {
    require(_to != address(0));
    require(_value <= transferableBalanceOf(msg.sender));

    balances[msg.sender] = balances[msg.sender].sub(_value);
    balances[_to] = balances[_to].add(_value);
    emit Transfer(msg.sender, _to, _value);
    return true;
}
```

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
