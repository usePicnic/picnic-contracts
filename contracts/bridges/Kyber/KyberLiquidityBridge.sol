// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IERC20.sol";
import "../interfaces/IUniswapV2Swap.sol";
import "./interfaces/IKyberDMM.sol";
import "../interfaces/IKyberLiquidity.sol";
import "./interfaces/ZapOut.sol";

/**
 * @title KyberLiquidityBridge
 * @author DeFi Basket
 *
 * @notice Add/remove liquidity using the Kyber DMM contract in Polygon.
 *
 * @dev This contract swaps ERC20 tokens to ERC20 tokens. Please notice that there are no payable functions.
 *
 */

contract KyberLiquidityBridge is IKyberLiquidity {
    IKyberDMM constant router = IKyberDMM(0x546C79662E028B661dFB4767664d0273184E4dD1);
    address constant zapOutAddress = 0x83D4908c1B4F9Ca423BEE264163BC1d50F251c31;
    ZapOut constant zapOut = ZapOut(zapOutAddress);

    /**
      * @notice Adds liquidity from 2 ERC20 tokens
      *
      * @dev Wraps add liquidity and generate the necessary events to communicate with DeFi Basket's UI and back-end.
      *
      * @param tokens List of two - token that will have liquidity added to pool
      * @param percentages List of two - percentages of the balance of ERC20 tokens that will be added to the pool
      * @param minAmounts List of two - minimum amounts of the ERC20 tokens required to add liquidity
      */
    function addLiquidity(
        address[] calldata tokens,
        address poolAddress,
        uint256[] calldata percentages,
        uint256[] calldata minAmounts,
        uint256[2] calldata vReserveRatioBounds
    ) external override {

        uint256 amountA = IERC20(tokens[0]).balanceOf(address(this)) * percentages[0] / 100000;
        uint256 amountB = IERC20(tokens[1]).balanceOf(address(this)) * percentages[1] / 100000;

        // Approve 0 first as a few ERC20 tokens are requiring this pattern.
        IERC20(tokens[0]).approve(address(router), 0);
        IERC20(tokens[0]).approve(address(router), amountA);

        IERC20(tokens[1]).approve(address(router), 0);
        IERC20(tokens[1]).approve(address(router), amountB);

        // Receive addLiquidityETH output in a array to avoid stack too deep error
        uint256[3] memory routerOutputs;

        // [amountToken, amountETH, liquidity]
        (routerOutputs[0], routerOutputs[1], routerOutputs[2]) = router.addLiquidity(
            tokens[0], //        address tokenA,
            tokens[1], //        address tokenB,
            poolAddress, //      address pool
            amountA, //        uint amountADesired,
            amountB, //        uint amountBDesired,
            minAmounts[0], //        uint amountAMin,
            minAmounts[1], //        uint amountBMin,
            vReserveRatioBounds,   // uint256[2] vReserveRatioBounds,
            address(this), //  address to,
            block.timestamp + 100000  //   uint deadline
        );

        // Prepare arguments for emitting event
        uint[] memory amountTokensArray = new uint[](2);
        amountTokensArray[0] = routerOutputs[0];
        amountTokensArray[1] = routerOutputs[1];

        emit DEFIBASKET_KYBER_ADD_LIQUIDITY(amountTokensArray, routerOutputs[2]);
    }

    /**
      * @notice Removes liquidity from 2 ERC20 tokens
      *
      * @dev Wraps remove liquidity and generate the necessary events to communicate with DeFi Basket's UI and
      * back-end.
      *
      * @param tokens List of two - token that will have liquidity removed from pool
      * @param percentage Percentage of LP token to be removed from pool
      * @param minAmounts List of two - minimum amounts of the ERC20 tokens required to remove liquidity
      */
    function removeLiquidity(
        address[] calldata tokens,
        address poolAddress,
        uint256 percentage,
        uint256[] calldata minAmounts
    ) external override {
        uint256 liquidity = IERC20(poolAddress).balanceOf(address(this)) * percentage / 100000;

        // Approve 0 first as a few ERC20 tokens are requiring this pattern.
        IERC20(poolAddress).approve(address(router), 0);
        IERC20(poolAddress).approve(address(router), liquidity);

        uint[] memory amountTokensArray = new uint[](2);

        (amountTokensArray[0], amountTokensArray[1])= router.removeLiquidity(
            tokens[0], // tokenA
            tokens[1], // tokenB
            poolAddress, // pool
            liquidity, // liquidity,
            minAmounts[0], // amountAMin
            minAmounts[1], // amountBMin
            address(this), // address to,
            block.timestamp + 100000  // uint deadline
        );

        emit DEFIBASKET_KYBER_REMOVE_LIQUIDITY(amountTokensArray, poolAddress, liquidity);
    }

    function removeLiquidityOneCoin(
        address tokenIn,
        address tokenOut,
        address poolAddress,
        uint256 percentage,
        uint256 minAmount
    ) external override {
        uint256 liquidity = IERC20(poolAddress).balanceOf(address(this)) * percentage / 100000;

        // Approve 0 first as a few ERC20 tokens are requiring this pattern.
        IERC20(poolAddress).approve(zapOutAddress, 0);
        IERC20(poolAddress).approve(zapOutAddress, liquidity);

        uint256 amountOut = zapOut.zapOut(
            tokenOut, // tokenOut
            tokenIn, // tokenIn
            liquidity, // liquidity,
            poolAddress, // pool
            address(this), // address to,
            minAmount, // amountAMin
            block.timestamp + 100000  // uint deadline
        );

        emit DEFIBASKET_KYBER_REMOVE_LIQUIDITY_ONE_COIN(liquidity, amountOut);
    }
}
