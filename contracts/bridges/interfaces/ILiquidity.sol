pragma solidity ^0.8.6;

interface ILiquidity {

    event AddLiquidity (
        address[] assetIn,
        uint256[] amountIn,
        address assetOut,
        uint256 amountOut
    );

    event AddLiquidityFromETH (
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
