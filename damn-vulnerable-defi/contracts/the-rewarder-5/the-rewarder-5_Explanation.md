# Damn Vulnerable DeFi: The Rewarder Challenge Exploitation

## Challenge Overview

The challenge "The Rewarder" is part of the Damn Vulnerable DeFi wargame. The game serves as an educational tool to understand the security aspects of DeFi smart contracts. The specific challenge entails a pool that distributes reward tokens every five days to users who deposit DVT tokens into it. The objective of this challenge is to obtain a majority of these rewards without initially owning any DVT tokens.

## Vulnerability

The primary vulnerability in this scenario is the lack of a mechanism to check the duration for which tokens are deposited in the pool during the calculation of rewards. This allows a participant to momentarily deposit a substantial quantity of tokens, claim the rewards, and then promptly withdraw the tokens.

## Exploit Steps

1. Deploy a smart contract capable of receiving a flash loan.
2. Forward the time by five days to when the rewards become available again.
3. The smart contract requests a flash loan of all available tokens.
4. The smart contract receives the tokens in a callback.
5. The smart contract deposits all tokens into the Reward Pool using the `deposit()` function.
6. The execution of `deposit()` triggers `distributeRewards()`.
7. The rewards are credited to the smart contract.
8. The smart contract instantly withdraws the tokens from the pool.
9. The tokens are returned to the lending pool to repay the flash loan.
10. The smart contract then transfers the reward tokens to the attacker's wallet.

## Code and Test

In the provided script, a contract `AttackRewardFactory` is deployed with parameters `flashLoanPool.address`, `liquidityToken.address`, `rewarderPool.address`, and `player.address`.

After forwarding the time by five days using `evm_increaseTime`, the `attack()` function is invoked on the `AttackRewardFactory` contract with `TOKENS_IN_LENDER_POOL` as the parameter.
