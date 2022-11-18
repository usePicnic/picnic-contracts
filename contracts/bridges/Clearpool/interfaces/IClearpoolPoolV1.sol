// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IClearpoolPoolV1 {

    function provide(
        uint256 currencyAmount    
    ) external;

    function redeem(
        uint256 tokens
    ) external;

    function withdrawReward(
        address account
    ) external;

    function withdrawableRewardOf(
        address account
    ) external view returns (uint256);

    function currency() external view returns (address);

}