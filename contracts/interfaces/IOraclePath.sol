pragma solidity >= 0.6.6;

interface IOraclePath {

    function consult(address[] calldata path) external view returns (uint256 amountOut);

    function updateOracles(address[] calldata path) external;

}