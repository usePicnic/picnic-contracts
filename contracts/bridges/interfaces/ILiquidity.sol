pragma solidity ^0.8.6;

interface ILiquidity {

    event AddLiquidity (
        address[] assetIn,
        uint256[] amountIn,
        address[] assetOut,
        uint256[] amountOut
    );

    function addLiquidity(address[] calldata tokens,
                          uint256[] calldata percentages,
                          uint256[] calldata minAmounts
                        ) external;

    function addLiquidityEth(address[] calldata tokens,
                            uint256[] calldata percentages,
                            uint256[] calldata minAmounts,
                            uint256 ethPercentage,
                            uint256 minAmountEth) external;
}


