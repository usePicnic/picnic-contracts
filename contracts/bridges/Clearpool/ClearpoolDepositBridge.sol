// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

import "./interfaces/IClearpoolPoolV1.sol";
import "./interfaces/IClearpoolFactoryV1.sol";
import "../interfaces/IClearpoolDeposit.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title ClearpoolDepositBridge
 * @author Picnic (formerly DeFi Basket)
 *
 * @notice Deposits and withdraws from Clearpool pools in Polygon.
 *
 * @dev This contract has 2 main functions:
 *
 * 1. Deposit in Clearpool pool
 * 2. Withdraw from Clearpool pool
 *
 */

contract ClearpoolDepositBridge is IClearpoolDeposit {
    /**
     * @notice Deposits into a Clearpool pool
     *
     * @dev Wraps Clearpool's pool provide function and generates an event to communicate with Picnic's UI and back-end.
     *
     * @param poolAddress The address of the Clearpool's pool.
     * @param percentageIn Percentage of the balance of the asset that will be deposited
     */
    function deposit(address poolAddress, uint256 percentageIn)
        external
        override
    {
        IClearpoolPoolV1 pool = IClearpoolPoolV1(poolAddress);
        IERC20 poolToken = IERC20(poolAddress);

        address assetIn = pool.currency();
        IERC20 assetInContract = IERC20(assetIn);
        uint256 amountIn = (assetInContract.balanceOf(address(this)) *
            percentageIn) / 100000;

        // Approve 0 first as a few ERC20 tokens are requiring this pattern.
        assetInContract.approve(poolAddress, 0);
        assetInContract.approve(poolAddress, amountIn);

        // Compute balance of mooToken before deposit
        uint256 poolTokenBalanceBefore = poolToken.balanceOf(address(this));

        pool.provide(amountIn);
        uint256 poolTokenReceived = poolToken.balanceOf(address(this)) -
            poolTokenBalanceBefore;

        emit DEFIBASKET_CLEARPOOL_DEPOSIT(assetIn, amountIn, poolTokenReceived);
    }

    /**
     * @notice Withdraws from the Clearpool pool
     *
     * @dev Wraps the Clearpool's pool redeem function and generates an event to communicate with Picnic's UI and back-end.
     *
     * @param poolAddress The address of the Clearpool pool.
     * @param percentageOut Percentage of poolToken that will be burned
     *
     */
    function withdraw(address poolAddress, uint256 percentageOut)
        external
        override
    {
        IClearpoolPoolV1 pool = IClearpoolPoolV1(poolAddress);
        IERC20 poolToken = IERC20(poolAddress);

        uint256 burnAmount = (poolToken.balanceOf(address(this)) *
            percentageOut) / 100000;

        // Compute balance of underlying asset before withdraw
        address assetReceived = pool.currency();
        uint256 assetBalanceBefore = IERC20(assetReceived).balanceOf(
            address(this)
        );
        pool.redeem(burnAmount);

        // Compute balance of underlying asset after withdraw
        uint256 amountReceived = IERC20(assetReceived).balanceOf(
            address(this)
        ) - assetBalanceBefore;

        emit DEFIBASKET_CLEARPOOL_WITHDRAW(
            burnAmount,
            assetReceived,
            amountReceived
        );
    }

    /**
     * @notice Claim rewards from a pool without unstaking principal
     *
     * @dev Wraps Clearpool's withdrawReward and generate the necessary events to communicate with DeFi Basket's UI and0
     * back-end.
     *
     * @param poolAddress The address of the Clearpool pool.
     *
     */
    function claimRewards(address poolAddress, address factoryAddress)
        external
        override
    {
        IClearpoolFactoryV1 factory = IClearpoolFactoryV1(factoryAddress);

        address[] memory poolAddresses = new address[](1);
        poolAddresses[0] = poolAddress;

        address rewardTokenAddress = 0xb08b3603C5F2629eF83510E6049eDEeFdc3A2D91;
        uint256 rewardTokenBalance = IERC20(rewardTokenAddress).balanceOf(
            address(this)
        );

        factory.withdrawReward(poolAddresses);

        uint256 rewardTokenBalanceOut = IERC20(rewardTokenAddress).balanceOf(
            address(this)
        ) - rewardTokenBalance;

        emit DEFIBASKET_CLEARPOOL_CLAIM(
            rewardTokenAddress,
            rewardTokenBalanceOut
        );
    }
}
