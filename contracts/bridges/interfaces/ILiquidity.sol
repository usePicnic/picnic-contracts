pragma solidity ^0.8.6;

interface ILiquidity {

    event INDEXPOOL_LIQUIDITY_ADD(
        address[] assetIn,
        uint256[] amountIn,
        address assetOut,
        uint256 amountOut
    );

    event INDEXPOOL_LIQUIDITY_REMOVE(
        address[] tokens,
        uint256[] amountTokensArray,
        address assetOut,
        uint256 liquidity
    );

    function addLiquidity(address[] calldata tokens,
                          uint256[] calldata percentages,
                          uint256[] calldata minAmounts
                        ) external;

    function removeLiquidity(address[] calldata tokens,
        uint256[] calldata minAmounts,
        address lpToken,
        uint256 percentage
    ) external;
}
