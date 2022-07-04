// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.6;

// Based on https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/gauges/LiquidityGaugeReward.vy
interface ICurveRewardGauge {

    function deposit(
        uint256 amount,     // amount to deposit in reward gauge
        address receiver  // address to deposit for
    ) external;

    function withdraw(
        uint256 amount,     // amount to withdraw from reward gauge
        bool claim_rewards  // whether to claim rewards
    ) external;

    function reward_tokens(
        uint256 index     // index of reward to claim (Max: 8)
    ) external returns(address);

}