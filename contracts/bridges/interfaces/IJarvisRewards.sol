// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

interface IJarvisRewards {
    event DEFIBASKET_JARVIS_CLAIM (
        address[] tokens
    );

    function claim(
        address tokenAddress,
        address rewardsPool
    ) external;
}
