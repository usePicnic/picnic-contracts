// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

import "./interfaces/ICometRewards.sol";
import "../interfaces/ICompoundRewards.sol";

contract CompoundRewardsBridge is ICompoundRewards {
    address constant cometRewards = 0x45939657d1CA34A8FA39A924B71D28Fe8431e581;

    function claim(address comet, address src, bool shouldAccrue) external {
        ICometRewards _cometReward = ICometRewards(cometRewards);
        _cometReward.claim(comet, src, shouldAccrue);

        emit DEFIBASKET_COMPOUND_REWARDS_CLAIM(comet, src, shouldAccrue);
    }
}
