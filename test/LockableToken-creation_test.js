const LockableToken = artifacts.require('./LockableToken.sol')

const assertThrows = require('./utils/assertThrows')
const assertExpectedArguments = require('./utils/assertExpectedArguments')

contract('LockableToken', ([owner]) => {
  const supply = 1000
  const lockedFor = 'CA'
  const lockedAmount = 500
  const lockTimestamp = Number(new Date()) / 1000
  const receiver = '0x0758dc7fa551f6E1E5aC48731aD9267fb854CeBB'

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
      const balance = await token.balances(owner)
      assert.equal(balance.toNumber(), supply)
    })

    it('has the right transferableBalance for the contract owner', async () => {
      const balance = await token.transferableBalanceOf(owner)
      assert.equal(balance.toNumber(), supply)
    })

    it('transferable balance reduces post locking', async () => {
      const lock = await token.lock(lockedFor, lockedAmount, lockTimestamp)
      const balance = await token.balances(owner)
      const transferableBalance = await token.transferableBalanceOf(owner)
      assert.equal(balance, supply)
      assert.equal(transferableBalance, supply - lockedAmount)
    })
  })
})
