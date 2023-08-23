// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

interface ICompoundRewards {
    event DEFIBASKET_COMPOUND_REWARDS_CLAIM(
        address comet,
        address src,
        bool shouldAccrue
    );
}
