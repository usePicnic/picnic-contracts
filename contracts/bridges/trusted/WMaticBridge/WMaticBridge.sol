pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IWMatic.sol";

contract WMaticBridge {
    address constant wMaticAddress = 0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270;
    IWMatic constant wmatic = IWMatic(wMaticAddress);

    event INDEXPOOL_WRAP_IN (
        uint256 amountIn
    );

    event INDEXPOOL_WRAP_OUT (
        uint256 amountOut
    );

    function wrap(uint256 percentageIn) external {
        emit INDEXPOOL_WRAP_IN(address(this).balance * percentageIn / 100000);
        wmatic.deposit{value : address(this).balance * percentageIn / 100000}();
    }

    function unwrap(uint256 percentageOut) external {
        emit INDEXPOOL_WRAP_OUT(IERC20(wMaticAddress).balanceOf(address(this)) * percentageOut / 100000);
        wmatic.withdraw(IERC20(wMaticAddress).balanceOf(address(this)) * percentageOut / 100000);
    }
}
