pragma solidity ^0.8.6;

interface ILiquidity {

    event IndexPool_Liquidity_Add (
        address[] assetIn,
        uint256[] amountIn,
        address assetOut,
        uint256 amountOut
    );

    event IndexPool_Liquidity_AddETH (
        uint256 ethAmount,
        address[] assetIn,
        uint256[] amountIn,
        address assetOut,
        uint256 amountOut
    );

    function addLiquidity(address[] calldata tokens,
                          uint256[] calldata percentages,
                          uint256[] calldata minAmounts
                        ) external;

    function addLiquidityETH(uint256 ethPercentage,
                            uint256 minAmountEth,
                            address[] calldata tokens,
                            uint256[] calldata percentages,
                            uint256[] calldata minAmounts
                            ) external;
}
