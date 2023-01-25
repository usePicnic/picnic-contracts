pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/ISynthereumWrapper.sol";
import "../interfaces/IJarvisWrap.sol";

contract JarvisWrap is IJarvisWrap {

    function wrap(
        address synthereumAddress,
        address assetIn,
        uint256 percentageIn,
        address assetOut
    ) external override {
        ISynthereumWrapper jarvis = ISynthereumWrapper(synthereumAddress);

        uint256 amount = IERC20(assetIn).balanceOf(address(this)) * percentageIn / 100000;

        // Approve 0 first as a few ERC20 tokens are requiring this pattern.
        IERC20(assetIn).approve(address(jarvis), 0);
        IERC20(assetIn).approve(address(jarvis), amount);

        uint256 amountOut = jarvis.wrap(amount,address(this));

        emit DEFIBASKET_JARVIS_WRAP(amount, amountOut);
    }

    function unwrap(
        address synthereumAddress,
        address assetIn,
        uint256 percentageIn,
        address assetOut
    ) external override {
        ISynthereumWrapper jarvis = ISynthereumWrapper(synthereumAddress);

        uint256 amount = IERC20(assetIn).balanceOf(address(this)) * percentageIn / 100000;

        // Approve 0 first as a few ERC20 tokens are requiring this pattern.
        IERC20(assetIn).approve(address(jarvis), 0);
        IERC20(assetIn).approve(address(jarvis), amount);
      
        uint256 amountOut = jarvis.unwrap(amount, address(this));

        emit DEFIBASKET_JARVIS_UNWRAP(amount, amountOut);
    }
}
