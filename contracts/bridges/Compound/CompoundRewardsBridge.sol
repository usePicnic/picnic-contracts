// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

import "./interfaces/ICometRewards.sol";
import "../interfaces/ICompoundRewards.sol";

contract CompoundRewardsBridge is ICompoundRewards {
    function claim(address comet, address src, bool shouldAccrue) external {
        ICometRewards _cometReward = ICometRewards(comet);
        _cometReward.claim(comet, src, shouldAccrue);

        emit DEFIBASKET_COMPOUND_REWARDS_CLAIM(comet, src, shouldAccrue);
    }
}
