// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IComet.sol";
import "../interfaces/ICompoundV3Bridge.sol";
import "./interfaces/ICometRewards.sol";

contract CompoundV3Bridge is ICompoundV3Bridge {
    address constant cometRewards = 0x45939657d1CA34A8FA39A924B71D28Fe8431e581;

    function supply(
        address asset,
        uint256 percentageIn,
        address cometAddress
    ) external override {
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

    function withdraw(
        address asset,
        uint256 percentageIn,
        address cometAddress
    ) external override {
        IComet _comet = IComet(cometAddress);
        uint256 amount = (_comet.balanceOf(address(this)) * percentageIn) /
            100000;
        ICometRewards _cometReward = ICometRewards(cometRewards);
        _comet.withdraw(asset, amount);
        _cometReward.claim(cometAddress, address(this), true);

        emit DEFIBASKET_COMPOUND_WITHDRAW(asset, amount);
    }

    function claim(address cometAddress) external override {
        ICometRewards _cometReward = ICometRewards(cometRewards);
        _cometReward.claim(cometAddress, address(this), true);

        emit DEFIBASKET_COMPOUND_REWARDS_CLAIM(
            cometAddress,
            address(this),
            true
        );
    }
}
