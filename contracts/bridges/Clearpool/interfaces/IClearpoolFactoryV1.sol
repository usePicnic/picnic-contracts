// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IClearpoolFactoryV1 {

    function withdrawReward(
        address[] memory poolsList
    ) external;

}