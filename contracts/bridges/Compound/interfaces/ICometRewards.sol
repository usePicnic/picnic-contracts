// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

interface ICometRewards {
    function claim(address comet, address src, bool shouldAccrue) external;
}
