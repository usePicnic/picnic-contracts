// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.6;

// Based on https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/gauges/LiquidityGaugeReward.vy
interface ICurveRewardGauge {

    function deposit(
        uint256 amount, // amount to deposit in reward gauge
        address receiver  // address to deposit for
    ) external;

}