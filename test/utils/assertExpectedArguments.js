/**
 *  assert that a an error expecting a specific number of arguments is thrown.
 *  @param promise — The promise to test.
 */
const assertExpectedArguments = count => async promise => {
  try {
    await promise;
    assert.fail('Expected error not received');
  } catch (error) {
    const expectedArgs =
      error.message.search(`expected ${count} arguments`) >= 0;
    assert.isTrue(expectedArgs, `Expected error, but got '${error}'`);
  }
};

module.exports = assertExpectedArguments;
