pragma solidity ^0.4.24;


import 'openzeppelin-solidity/contracts/math/SafeMath.sol';


contract LockableToken {
    using SafeMath for uint256;

    /**
     * @dev Utilities for which a token can be locked
     */
    bytes32[] public locked_for;
    /**
     * @dev Ability to fetch whether a given utility is active for locking
     */
    mapping(bytes32=>bool) public locking_active;

    struct lockToken {
        uint256 amount;
        uint256 validity;
    }

    /**
     * @dev Holds number & validity of tokens locked for a given purpose for
     *      a given member address
     */
    mapping(address => mapping(bytes32 => lockToken[])) public locked;

    mapping (address => mapping (address => uint256)) internal allowed;

    mapping(address => uint256) public balances;

    uint256 totalSupply_;

    event Lock(
        address indexed _of,
        bytes32 indexed _for,
        uint256 _amount,
        uint256 _validity
    );

    event Transfer(address indexed from, address indexed to, uint256 value);

    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    constructor(uint256 _supply) public {
        require(_supply != 0);        
        totalSupply_ = _supply;
        balances[msg.sender] = _supply;
        //Utility - Claims Assesssment
        locked_for.push("CA");
        locking_active["CA"]=true;
        //Utility  - Governance
        locked_for.push("GOV");
        locking_active["GOV"]=true;
    }

    /**
     * @dev Returns tokens locked for a specified address for a
     *      specified purpose at a specified time
     *
     * @param _of The address whose tokens are locked
     * @param _for The purpose to query the lock tokens for
     * @param _time The timestamp to query the lock tokens for
     */
    function tokensLocked(address _of, bytes32 _for, uint256 _time)
        public
        view
        returns (uint256 amount)
    {
        for(uint256 i=0;i<locked[_of][_for].length;i++)
        {
            if(locked[_of][_for][i].validity>_time)
                amount+=locked[_of][_for][i].amount;
        }
    }

    /**
     * @dev Returns tokens available for transfer for a specified address
     * @param _of The address to query the the lock tokens of
     */
    function transferableBalanceOf(address _of)
        public
        view
        returns (uint256 amount)
    {
        uint256 lockedAmount = 0;
        for (uint256 i=0; i < locked_for.length; i++) {
            lockedAmount += tokensLocked(_of,locked_for[i], block.timestamp);
        }
        amount = balances[_of].sub(lockedAmount);
    }

    /**
     * @dev Locks a specified amount of tokens against an address,
     *      for a specified purpose and time
     * @param _for The purpose to lock tokens
     * @param _amount Number of tokens to be locked
     * @param _time Lock time in seconds
     */
    function lock(bytes32 _for, uint256 _amount, uint256 _time)
        public
    {
        uint256 validUntil=block.timestamp.add(_time);
        require(_amount <= transferableBalanceOf(msg.sender));
        require(locking_active[_for]);
        locked[msg.sender][_for].push(lockToken(_amount, validUntil));
        emit Lock(msg.sender, _for, _amount, validUntil);
    }

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
     * @dev Approve the passed address to spend the specified amount of tokens
     *      on behalf of msg.sender.
     *
     * Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this
     * race condition is to first reduce the spender's allowance to 0 and
     * set the desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * @param _spender The address which will spend the funds.
     * @param _value The amount of tokens to be spent.
     */
    function approve(address _spender, uint256 _value) public returns (bool) {
        allowed[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    /**
     * @dev Function to check the amount of tokens that an owner allowed to a spender.
     * @param _owner address The address which owns the funds.
     * @param _spender address The address which will spend the funds.
     * @return A uint256 specifying the amount of tokens still available for the spender.
     */
    function allowance(address _owner, address _spender)
        public
        view
        returns (uint256)
    {
        return allowed[_owner][_spender];
    }

    /**
     * @dev Increase the amount of tokens that an owner allowed to a spender.
     *
     * approve should be called when allowed[_spender] == 0. To increment
     * allowed value is better to use this function to avoid 2 calls (and wait until
     * the first transaction is mined)
     * From MonolithDAO Token.sol
     * @param _spender The address which will spend the funds.
     * @param _addedValue The amount of tokens to increase the allowance by.
     */
    function increaseApproval(
        address _spender,
        uint _addedValue
    )
        public
        returns (bool)
    {
        allowed[msg.sender][_spender] = allowed[msg.sender][_spender].add(_addedValue);
        emit Approval(msg.sender, _spender, allowed[msg.sender][_spender]);
        return true;
    }

    /**
     * @dev Decrease the amount of tokens that an owner allowed to a spender.
     *
     * approve should be called when allowed[_spender] == 0. To decrement
     * allowed value is better to use this function to avoid 2 calls (and wait until
     * the first transaction is mined)
     * From MonolithDAO Token.sol
     * @param _spender The address which will spend the funds.
     * @param _subtractedValue The amount of tokens to decrease the allowance by.
     */
    function decreaseApproval(
        address _spender,
        uint _subtractedValue
    )
        public
        returns (bool)
    {
        uint oldValue = allowed[msg.sender][_spender];
        if (_subtractedValue > oldValue) {
            allowed[msg.sender][_spender] = 0;
        } else {
            allowed[msg.sender][_spender] = oldValue.sub(_subtractedValue);
        }
        emit Approval(msg.sender, _spender, allowed[msg.sender][_spender]);
        return true;
    }

    /**
     * @dev total number of tokens in existence
     */
    function totalSupply() public view returns (uint256) {
        return totalSupply_;
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

    /**
     * @dev Gets the balance of the specified address.
     * @param _owner The address to query the the balance of.
     * @return An uint256 representing the amount owned by the passed address.
     */
    function balanceOf(address _owner) public view returns (uint256) {
        return balances[_owner];
    }
}
