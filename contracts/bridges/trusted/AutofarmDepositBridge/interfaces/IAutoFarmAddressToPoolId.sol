pragma solidity ^0.8.6;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IAutoFarmAddressToPoolId {
    function getPoolId(address asset) external returns (uint256);
}