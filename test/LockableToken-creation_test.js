const LockableToken = artifacts.require('./LockableToken.sol')
const assertThrows = require('./utils/assertThrows')
const assertExpectedArguments = require('./utils/assertExpectedArguments')
const { assertRevert } = require('./utils/assertRevert')
const { timeTravel } = require('./utils/timeTravel')

contract('LockableToken', ([owner, receiver, spender]) => {
  const supply = 1000
  const lockReason = 'GOV'
  const lockReason2 = 'CLAIM'
  const lockedAmount = 200
  const lockPeriod = 1000
  const lockTimestamp = Number(new Date()) / 1000
  const approveAmount = 10
  const nullAddress = 0x0000000000000000000000000000000000000000
  const increaseTime = function(duration) {
    // const increaseTime = function(duration) {
    const id = Date.now()

    return new Promise((resolve, reject) => {
      web3.currentProvider.sendAsync(
        {
          jsonrpc: '2.0',
          method: 'evm_increaseTime',
          params: [duration],
          id: id
        },
        err1 => {
          if (err1) return reject(err1)

          web3.currentProvider.sendAsync(
            {
              jsonrpc: '2.0',
              method: 'evm_mine',
              id: id + 1
            },
            (err2, res) => {
              return err2 ? reject(err2) : resolve(res)
            }
          )
        }
      )
    })
  }

  context('given invalid params', () => {
    it('error if not supplied any params', () =>
      assertExpectedArguments(1)(LockableToken.new()))
  })

  context('given valid params', () => {
    let token

    before(async () => {
      token = await LockableToken.new(supply)
    })

    it('can be created', () => {
      assert.ok(token)
    })

    it('has the right balance for the contract owner', async () => {
      const balance = await token.balanceOf(owner)
      const totalBalance = await token.totalBalanceOf(owner)
      const totalSupply = await token.totalSupply()
      assert.equal(balance.toNumber(), supply)
      assert.equal(totalBalance.toNumber(), supply)
      assert.equal(totalSupply.toNumber(), supply)
    })

    it('has the right total balance for the contract owner', async () => {
      const balance = await token.totalBalanceOf(owner)
      assert.equal(balance.toNumber(), supply)
    })

    it('reduces locked tokens from transferable balance', async () => {
      const origBalance = await token.balanceOf(owner)
      const currentTimestamp = Number(new Date()) / 1000
      await token.lock(lockReason, lockedAmount, lockPeriod)
      const balance = await token.balanceOf(owner)
      const totalBalance = await token.totalBalanceOf(owner)
      assert.equal(balance.toNumber(), origBalance.toNumber() - lockedAmount)
      assert.equal(totalBalance.toNumber(), origBalance.toNumber())
      var actualLockedAmount = await token.tokensLocked(owner, lockReason)
      assert.equal(lockedAmount, actualLockedAmount.toNumber())
      actualLockedAmount = await token.tokensLockedAtTime(
        owner,
        lockReason,
        currentTimestamp + lockPeriod + 1
      )
      assert.equal(0, actualLockedAmount.toNumber())

      const transferAmount = 1
      const { logs } = await token.transfer(receiver, transferAmount, {
        from: owner
      })
      const newSenderBalance = await token.balanceOf(owner)
      const newReceiverBalance = await token.balanceOf(receiver)
      assert.equal(newReceiverBalance.toNumber(), transferAmount)
      assert.equal(newSenderBalance.toNumber(), balance - transferAmount)
      assert.equal(logs.length, 1)
      assert.equal(logs[0].event, 'Transfer')
      assert.equal(logs[0].args.from, owner)
      assert.equal(logs[0].args.to, receiver)
      assert(logs[0].args.value.eq(transferAmount))
    })

    it('reverts locking more tokens via lock function', async () => {
      const balance = await token.balanceOf(owner)
      await assertRevert(token.lock(lockReason, balance, lockPeriod))
    })

    it('can extend lock period for an existing lock', async () => {
      await token.tokensLocked(owner, lockReason)
      const lockValidityOrig = await token.locked(owner, lockReason)
      await token.extendLock(lockReason, lockPeriod)
      const lockValidityExtended = await token.locked(owner, lockReason)
      assert.equal(
        lockValidityExtended[1].toNumber(),
        lockValidityOrig[1].toNumber() + lockPeriod
      )
      await assertRevert(token.extendLock(lockReason2, lockPeriod))
      await assertRevert(token.increaseLockAmount(lockReason2, lockPeriod))
    })

    it('can increase the number of tokens locked', async () => {
      const actualLockedAmount = await token.tokensLocked(owner, lockReason)
      await token.increaseLockAmount(lockReason, lockedAmount)
      const increasedLockAmount = await token.tokensLocked(owner, lockReason)
      assert.equal(
        increasedLockAmount.toNumber(),
        actualLockedAmount.toNumber() + lockedAmount
      )
    })

    it('cannot transfer tokens to null address', async function() {
      await assertRevert(
        token.transfer(nullAddress, 100, {
          from: owner
        })
      )
    })

    it('cannot transfer tokens greater than transferable balance', async () => {
      const balance = await token.balanceOf(owner)
      await assertRevert(token.transfer(receiver, balance + 1, { from: owner }))
    })

    it('can approve transfer to a spender', async () => {
      const initialAllowance = await token.allowance(owner, spender)
      await token.approve(spender, approveAmount)
      const newAllowance = await token.allowance(owner, spender)
      assert(newAllowance.toNumber(), initialAllowance + approveAmount)

      it('cannot transfer tokens from an address greater than allowance', async () => {
        await assertRevert(
          token.transferFrom(owner, receiver, 2, { from: spender })
        )
      })
    })

    it('cannot transfer tokens from an address to null address', async () => {
      await assertRevert(
        token.transferFrom(owner, nullAddress, 100, { from: owner })
      )
    })

    it('cannot transfer tokens from an address greater than owners balance', async () => {
      const balance = await token.balanceOf(owner)
      await token.approve(spender, balance)
      // const approveTransfer = await token.approve(spender, balance)
      await assertRevert(
        token.transferFrom(owner, receiver, balance.toNumber() + 1, {
          from: spender
        })
      )
    })

    it('can transfer tokens from an address less than owners balance', async () => {
      const balance = await token.balanceOf(owner)
      await token.approve(spender, balance)
      const { logs } = await token.transferFrom(
        owner,
        receiver,
        balance.toNumber(),
        { from: spender }
      )
      assert.equal(logs.length, 1)
      assert.equal(logs[0].event, 'Transfer')
      assert.equal(logs[0].args.from, owner)
      assert.equal(logs[0].args.to, receiver)
      assert(logs[0].args.value.eq(balance))
    })

    it('can unLockTokens', async () => {
      const lockValidityExtended = await token.locked(owner, lockReason)
      const balance = await token.balanceOf(owner)
      let unlockableToken = await token.getUnlockableTokens(owner)
      await increaseTime(
        (lockValidityExtended[1].toNumber() - lockTimestamp) * 2
      )
      unlockableToken = await token.getUnlockableTokens(owner)
      assert.equal(
        unlockableToken.toNumber(),
        lockValidityExtended[0].toNumber()
      )
      await token.unlock(owner)
      unlockableToken = await token.getUnlockableTokens(owner)
      assert.equal(unlockableToken.toNumber(), 0)
      const newBalance = await token.balanceOf(owner)
      console.log(newBalance.toNumber())
      console.log(balance.toNumber())
      console.log(lockValidityExtended[0].toNumber())
      assert.equal(
        newBalance.toNumber(),
        balance.toNumber() + lockValidityExtended[0].toNumber()
      )
    })
  })
})
