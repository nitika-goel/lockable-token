const LockableToken = artifacts.require('./LockableToken.sol');
const assertExpectedArguments = require('./utils/assertExpectedArguments');
const { assertRevert } = require('./utils/assertRevert');

contract('LockableToken', ([owner, receiver, spender, account2]) => {
  const supply = 1000;
  const name = 'ERC1132';
  const symbol = 'E1132';
  const decimals = 18;
  const lockReason = 'GOV';
  const lockReason2 = 'CLAIM';
  const lockReason3 = 'VESTED';
  const lockedAmount = 200;
  const lockPeriod = 1000;
  let blockNumber = web3.eth.blockNumber;
  const lockTimestamp = web3.eth.getBlock(blockNumber).timestamp;
  const approveAmount = 10;
  const nullAddress = 0x0000000000000000000000000000000000000000;
  const increaseTime = function(duration) {
    web3.currentProvider.sendAsync(
      {
        jsonrpc: '2.0',
        method: 'evm_increaseTime',
        params: [duration],
        id: lockTimestamp
      },
      (err, resp) => {
        if (!err) {
          web3.currentProvider.send({
            jsonrpc: '2.0',
            method: 'evm_mine',
            params: [],
            id: lockTimestamp + 1
          });
        }
      }
    );
  };

  context('given invalid params', () => {
    it('error if not supplied any params', () =>
      assertExpectedArguments(4)(LockableToken.new()));
  });

  context('given valid params', () => {
    let token;

    before(async () => {
      token = await LockableToken.new(supply, name, symbol, decimals);
    });

    it('can be created', () => {
      assert.ok(token);
    });

    it('has the right balance for the contract owner', async () => {
      const balance = await token.balanceOf(owner);
      const totalBalance = await token.totalBalanceOf(owner);
      const totalSupply = await token.totalSupply();
      const tokenName = await token.name();
      const tokenSymbol = await token.symbol();
      const tokenDecimals = await token.decimals();

      assert.equal(balance.toNumber(), supply);
      assert.equal(totalBalance.toNumber(), supply);
      assert.equal(totalSupply.toNumber(), supply);
      assert.equal(tokenName, name);
      assert.equal(tokenSymbol, symbol);
      assert.equal(tokenDecimals.toNumber(), decimals);

      token.transfer(account2, balance / 2, { from: owner });
    });

    it('has the right total balance for the contract owner', async () => {
      const balance = await token.totalBalanceOf(owner);
      assert.equal(balance.toNumber() * 2, supply);
    });

    it('reduces locked tokens from transferable balance', async () => {
      const origBalance = await token.balanceOf(owner);
      blockNumber = await web3.eth.blockNumber;
      const newLockTimestamp = await web3.eth.getBlock(blockNumber).timestamp;
      await token.lock(lockReason, lockedAmount, lockPeriod);
      const balance = await token.balanceOf(owner);
      const totalBalance = await token.totalBalanceOf(owner);
      assert.equal(balance.toNumber(), origBalance.toNumber() - lockedAmount);
      assert.equal(totalBalance.toNumber(), origBalance.toNumber());
      let actualLockedAmount = await token.tokensLocked(owner, lockReason);
      assert.equal(lockedAmount, actualLockedAmount.toNumber());
      actualLockedAmount = await token.tokensLockedAtTime(
        owner,
        lockReason,
        newLockTimestamp + lockPeriod + 1
      );
      assert.equal(0, actualLockedAmount.toNumber());

      const transferAmount = 1;
      const { logs } = await token.transfer(receiver, transferAmount, {
        from: owner
      });
      const newSenderBalance = await token.balanceOf(owner);
      const newReceiverBalance = await token.balanceOf(receiver);
      assert.equal(newReceiverBalance.toNumber(), transferAmount);
      assert.equal(newSenderBalance.toNumber(), balance - transferAmount);
      assert.equal(logs.length, 1);
      assert.equal(logs[0].event, 'Transfer');
      assert.equal(logs[0].args.from, owner);
      assert.equal(logs[0].args.to, receiver);
      assert(logs[0].args.value.eq(transferAmount));
    });

    it('reverts locking more tokens via lock function', async () => {
      const balance = await token.balanceOf(owner);
      await assertRevert(token.lock(lockReason, balance, lockPeriod));
    });

    it('can extend lock period for an existing lock', async () => {
      await token.tokensLocked(owner, lockReason);
      const lockValidityOrig = await token.locked(owner, lockReason);
      await token.extendLock(lockReason, lockPeriod);
      const lockValidityExtended = await token.locked(owner, lockReason);
      assert.equal(
        lockValidityExtended[1].toNumber(),
        lockValidityOrig[1].toNumber() + lockPeriod
      );
      await assertRevert(token.extendLock(lockReason2, lockPeriod));
      await assertRevert(token.increaseLockAmount(lockReason2, lockPeriod));
    });

    it('can increase the number of tokens locked', async () => {
      const actualLockedAmount = await token.tokensLocked(owner, lockReason);
      await token.increaseLockAmount(lockReason, lockedAmount);
      const increasedLockAmount = await token.tokensLocked(owner, lockReason);
      assert.equal(
        increasedLockAmount.toNumber(),
        actualLockedAmount.toNumber() + lockedAmount
      );
    });

    it('cannot transfer tokens to null address', async function() {
      await assertRevert(
        token.transfer(nullAddress, 100, {
          from: owner
        })
      );
    });

    it('cannot transfer tokens greater than transferable balance', async () => {
      const balance = await token.balanceOf(owner);
      await assertRevert(
        token.transfer(receiver, balance + 1, { from: owner })
      );
    });

    it('can approve transfer to a spender', async () => {
      const initialAllowance = await token.allowance(owner, spender);
      await token.approve(spender, approveAmount);
      const newAllowance = await token.allowance(owner, spender);
      assert(newAllowance.toNumber(), initialAllowance + approveAmount);

      it('cannot transfer tokens from an address greater than allowance', async () => {
        await assertRevert(
          token.transferFrom(owner, receiver, 2, { from: spender })
        );
      });
    });

    it('cannot transfer tokens from an address to null address', async () => {
      await assertRevert(
        token.transferFrom(owner, nullAddress, 100, { from: owner })
      );
    });

    it('cannot transfer tokens from an address greater than owners balance', async () => {
      const balance = await token.balanceOf(owner);
      await token.approve(spender, balance);
      // const approveTransfer = await token.approve(spender, balance)
      await assertRevert(
        token.transferFrom(owner, receiver, balance.toNumber() + 1, {
          from: spender
        })
      );
    });

    it('can transfer tokens from an address less than owners balance', async () => {
      const balance = await token.balanceOf(owner);
      await token.approve(spender, balance);
      const { logs } = await token.transferFrom(
        owner,
        receiver,
        balance.toNumber(),
        { from: spender }
      );
      assert.equal(logs.length, 1);
      assert.equal(logs[0].event, 'Transfer');
      assert.equal(logs[0].args.from, owner);
      assert.equal(logs[0].args.to, receiver);
      assert(logs[0].args.value.eq(balance));
    });

    it('can unLockTokens', async () => {
      const lockValidityExtended = await token.locked(owner, lockReason);
      const balance = await token.balanceOf(owner);
      const tokensLocked = await token.tokensLockedAtTime(
        owner,
        lockReason,
        lockTimestamp
      );
      await increaseTime(
        lockValidityExtended[1].toNumber() + 60 - lockTimestamp
      );
      var unlockableToken = await token.getUnlockableTokens(owner);
      assert.equal(unlockableToken.toNumber(), tokensLocked.toNumber());
      await token.unlock(owner);
      unlockableToken = await token.getUnlockableTokens(owner);
      assert.equal(unlockableToken.toNumber(), 0);
      const newBalance = await token.balanceOf(owner);
      assert.equal(
        newBalance.toNumber(),
        balance.toNumber() + tokensLocked.toNumber()
      );
      await token.unlock(owner);
      const newNewBalance = await token.balanceOf(owner);
      assert.equal(newBalance.toNumber(), newNewBalance.toNumber());
    });

    it('should allow to lock token again', async () => {
      token.lock('0x41', 1, 0);
      await token.unlock(owner);
      token.lock('0x41', 1, 0);
    });

    it('can transferWithLock', async () => {
      const account2Balance = (await token.balanceOf(account2)).toNumber();
      const receiverBalance = (await token.balanceOf(receiver)).toNumber();
      await token.transferWithLock(receiver, lockReason3, 1, 180, {
        from: account2
      });
      await assertRevert(
        token.transferWithLock(
          receiver,
          lockReason3,
          account2Balance,
          lockPeriod,
          { from: account2 }
        )
      );
      const locked = await token.locked(receiver, lockReason3);
      assert.equal(
        (await token.totalBalanceOf(account2)).toNumber(),
        account2Balance - 1
      );
      assert.equal(
        (await token.totalBalanceOf(receiver)).toNumber(),
        receiverBalance + 1
      );
      assert.equal(locked[0].toNumber(), 1);
    });

    it('should not allow 0 lock amount', async () => {
      await assertRevert(token.lock('0x414141', 0, lockTimestamp));
      await assertRevert(
        token.transferWithLock(receiver, '0x414141', 0, lockPeriod)
      );
    });

    it('should show 0 lock amount for unknown reasons', async () => {
      const actualLockedAmount = await token.tokensLocked(owner, '0x4141');
      assert.equal(actualLockedAmount.toNumber(), 0);
    });

    it('should not allow to increase lock amount by more than balance', async () => {
      await assertRevert(
        token.increaseLockAmount(
          lockReason,
          (await token.balanceOf(owner)).toNumber() + 1
        )
      );
    });

    it('should not allow to transfer and lock more than balance', async () => {
      const ownerBalance = (await token.balanceOf(owner)).toNumber();
      await assertRevert(
        token.transferWithLock(receiver, '0x4142', ownerBalance + 1, lockPeriod)
      );
    });

    it('should allow transfer with lock again after claiming', async () => {
      await increaseTime(180);
      await token.unlock(receiver);
      await token.transferWithLock(receiver, lockReason3, 1, 0);
    });
  });
});
