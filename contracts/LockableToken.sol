pragma solidity ^0.4.24;


import 'openzeppelin-solidity/contracts/math/SafeMath.sol';
// import './SafeMath.sol';


contract LockableToken {
    using SafeMath for uint256;

    /**
     * @dev Reasons why a user's tokens have been locked
     */
    mapping(address => bytes32[]) public lockReason;

    struct lockToken {
        uint256 amount;
        uint256 validity;
    }

    /**
     * @dev Holds number & validity of tokens locked for a given reason for
     *      a given member address
     */
    mapping(address => mapping(bytes32 => lockToken)) public locked;

    mapping (address => mapping (address => uint256)) internal allowed;

    mapping(address => uint256) balances;

    uint256 totalSupply_;

    event Lock(
        address indexed _of,
        bytes32 indexed _reason,
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
        totalSupply_ = _supply;
        balances[msg.sender] = _supply;
    }
    
    /**
     * @dev Locks a specified amount of tokens against an address,
     *      for a specified reason and time
     * @param _reason The reason to lock tokens
     * @param _amount Number of tokens to be locked
     * @param _time Lock time in seconds
     */
    function lock(bytes32 _reason, uint256 _amount, uint256 _time)
        public
        returns (bool)
    {
        uint256 validUntil = block.timestamp.add(_time);
        // If tokens are already locked, the functions extendLock or
        // increaseLockAmount should be used to make any changes
        require(tokensLocked(msg.sender, _reason, block.timestamp) == 0);
        require(_amount <= balanceOf(msg.sender));
        if (locked[msg.sender][_reason].amount == 0)
            lockReason[msg.sender].push(_reason);
        locked[msg.sender][_reason] = lockToken(_amount, validUntil);
        emit Lock(msg.sender, _reason, _amount, validUntil);
        return true;
    }

    /**
     * @dev Returns tokens locked for a specified address for a
     *      specified reason at a specified time
     *
     * @param _of The address whose tokens are locked
     * @param _reason The reason to query the lock tokens for
     * @param _time The timestamp to query the lock tokens for
     */
    function tokensLocked(address _of, bytes32 _reason, uint256 _time)
        public
        view
        returns (uint256 amount)
    {
        if (locked[_of][_reason].validity > _time)
            amount = locked[_of][_reason].amount;
    }

    /**
     * @dev Returns tokens available for transfer for a specified address
     * @param _of The address to query the the lock tokens of
     */
    function totalBalanceOf(address _of)
        public
        view
        returns (uint256 amount)
    {
        return(balances[_of]);
    }    
    
    /**
     * @dev Extends lock for a specified reason and time
     * @param _reason The reason to lock tokens
     * @param _time Lock extension time in seconds
     */
    function extendLock(bytes32 _reason, uint256 _time)
        public
        returns (bool)
    {
        require(tokensLocked(msg.sender, _reason, block.timestamp) > 0);
        locked[msg.sender][_reason].validity += _time;
        emit Lock(msg.sender, _reason, locked[msg.sender][_reason].amount, locked[msg.sender][_reason].validity);
        return true;
    }
    
    /**
     * @dev Increase number of tokens locked for a specified reason
     * @param _reason The reason to lock tokens
     * @param _amount Number of tokens to be increased
     */
    function increaseLockAmount(bytes32 _reason, uint256 _amount)
        public
        returns (bool)
    {
        require(tokensLocked(msg.sender, _reason, block.timestamp) > 0);
        locked[msg.sender][_reason].amount += _amount;
        emit Lock(msg.sender, _reason, locked[msg.sender][_reason].amount, locked[msg.sender][_reason].validity);
        return true;
    }
    
     /**
     * @dev Gets the balance of the specified address.
     * @param _owner The address to query the the balance of.
     * @return An uint256 representing the amount owned by the passed address.
     */
    function balanceOf(address _owner) public view returns (uint256) {
        uint256 lockedAmount = 0;
        for (uint256 i = 0; i < lockReason[_owner].length; i++) {
            lockedAmount += tokensLocked(_owner, lockReason[_owner][i], block.timestamp);
        }   
        uint256 amount = balances[_owner].sub(lockedAmount);
        return amount;
    }

    /**
     * @dev transfer token for a specified address
     * @param _to The address to transfer to.
     * @param _value The amount to be transferred.
     */
    function transfer(address _to, uint256 _value) public returns (bool) {
        require(_to != address(0));
        require(_value <= balanceOf(msg.sender));
        balances[msg.sender] = balances[msg.sender].sub(_value);
        balances[_to] = balances[_to].add(_value);
        emit Transfer(msg.sender, _to, _value);
        return true;
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
        require(_value <= balanceOf(_from));
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
     * @dev total number of tokens in existence
     */
    function totalSupply() public view returns (uint256) {
        return totalSupply_;
    }
   
}
