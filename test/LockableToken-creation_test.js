const LockableToken = artifacts.require('./LockableToken.sol')

const assertThrows = require('./utils/assertThrows')
const assertExpectedArguments = require('./utils/assertExpectedArguments')

contract('LockableToken', ([owner]) => {
  const supply = 1000
  const lockedFor = 100 // I am not clear what this is for

  context('given invalid params', () => {
    it('error if not supplied any params', () =>
      assertExpectedArguments(2)(LockableToken.new()))

    it('error if only supplied one param', () =>
      assertExpectedArguments(2)(LockableToken.new(supply)))

    it('throws if supplied zero value for supply', () =>
      assertThrows(LockableToken.new(0, lockedFor)))

    it('throws if supplied zero value for lockedFor', () =>
      assertThrows(LockableToken.new(supply, 0)))
  })

  context('given valid params', () => {
    let token

    before(async () => {
      token = await LockableToken.new(supply, lockedFor)
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
  })
})
