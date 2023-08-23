// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IComet.sol";
import "../interfaces/ICompoundV3Bridge.sol";

contract CompoundV3Bridge is ICompoundV3Bridge {
    address constant cometAddress = 0xF25212E676D1F7F89Cd72fFEe66158f541246445;

    function supply(address asset, uint256 percentageIn) external override {
        IComet _comet = IComet(cometAddress);
        uint256 amount = (IERC20(asset).balanceOf(address(this)) *
            percentageIn) / 100000;
        // Approve 0 first as a few ERC20 tokens are requiring this pattern.
        IERC20(asset).approve(cometAddress, 0);
        IERC20(asset).approve(cometAddress, amount);

        // TODO: Is this contract the right one?
        _comet.supply(asset, amount);

        emit DEFIBASKET_COMPOUND_SUPPLY(asset, amount);
    }

    function withdraw(address asset, uint amount) external override {
        IComet _comet = IComet(cometAddress);
        _comet.withdraw(asset, amount);

        emit DEFIBASKET_COMPOUND_WITHDRAW(asset, amount);
    }

    function balanceOf(address account) public view override returns (uint256) {
        IComet _comet = IComet(cometAddress);
        return _comet.balanceOf(account);
    }
}
