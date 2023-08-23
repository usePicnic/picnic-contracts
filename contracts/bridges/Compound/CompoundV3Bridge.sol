// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IComet.sol";
import "../interfaces/ICompoundV3Bridge.sol";

contract CompoundV3Bridge is ICompoundV3Bridge {
    address constant cometAddress = 0xf25212e676d1f7f89cd72ffee66158f541246445;

    function supply(address asset, uint amount) external override {
        IComet _comet = IComet(cometAddress);
        // Approve 0 first as a few ERC20 tokens are requiring this pattern.
        IERC20(asset).approve(compoundUSDCAddress, 0);
        IERC20(asset).approve(compoundUSDCAddress, amount);

        // TODO: Is this contract the right one?
        _comet.supply(asset, amount);

        emit DEFIBASKET_COMPOUND_SUPPLY(asset, amount);
    }

    function withdraw(address asset, uint amount) external override {
        IComet _comet = IComet(cometAddress);
        _comet.withdraw(asset, amount);

        emit DEFIBASKET_COMPOUND_WITHDRAW(asset, amount);
    }
}
