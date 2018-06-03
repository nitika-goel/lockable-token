// adapted from https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/test/helpers/expectThrow.js

const INVALID_OPCODE = 'invalid opcode'
const OUT_OF_GAS = 'out of gas'
const REVERT = 'revert'

/**
 *  assert that a promise throws either an invalidOpcode, outOfGas, or revert error.
 *  @param promise — The promise to test.
 */
const assertExpectedArguments = count => async promise => {
  try {
    await promise
    assert.fail('Expected error not received')
  } catch (error) {
    const expectedArgs =
      error.message.search(`expected ${count} arguments`) >= 0
    assert.isTrue(expectedArgs, `Expected error, but got '${error}'`)
  }
}

module.exports = assertExpectedArguments
