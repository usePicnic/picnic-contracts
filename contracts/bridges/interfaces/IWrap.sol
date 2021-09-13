pragma solidity ^0.8.6;

interface IWrap {
    event INDEXPOOL_WRAP_IN (
        uint256 amountIn
    );

    event INDEXPOOL_WRAP_OUT (
        uint256 amountOut
    );

    function wrap(uint256 percentageIn) external;

    function unwrap(uint256 percentageOut) external;
}
