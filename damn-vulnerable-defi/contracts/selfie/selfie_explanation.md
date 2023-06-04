# Selfie Challenge Write-up

## Challenge Overview

This challenge revolves around a system with a liquidity pool called `SelfiePool` for the `DamnValuableTokenSnapshot`. This pool supports flash loans, which enable any user to borrow an arbitrary amount of tokens as long as the tokens are returned within the same transaction.

The `SelfiePool` is under the control of a `SimpleGovernance` contract. This contract allows token holders to propose and execute actions. The governance contract carries out actions based on a snapshot of token balances, which can be updated by anyone by invoking the `snapshot` function on the token contract.

## Vulnerability

The system has a vulnerability in it that allows a user to take a flash loan for all tokens in the pool and immediately take a snapshot. This process temporarily gives the user a majority of the tokens, which they can use to queue an action in the governance contract.

The action could be anything that benefits the attacker, such as draining all the funds from the pool. The action will be approved since it is based on the snapshot taken post flash loan, even if the user returns the tokens and no longer holds the majority.

## Exploit

The exploit contract `AttackSelfie` exploits this vulnerability. It first requests a flash loan for the maximum amount of tokens available in the pool. Upon receiving the loan, it takes a snapshot and then queues an action to call the `emergencyExit` function on the pool, which transfers all tokens to a specified address (the owner of the attack contract in this case). Subsequently, it approves the pool to withdraw the loaned amount.

The test case involves deploying the attack contract, invoking the `attack` function to initiate the exploit, advancing the time to meet the delay requirement of the governance contract, and finally executing the action to transfer all tokens from the pool to the attacker.
