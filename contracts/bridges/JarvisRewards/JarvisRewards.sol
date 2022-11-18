// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IJarvisRewardsAdapter.sol";
import "../interfaces/IJarvisRewards.sol";
import "hardhat/console.sol";
/**
 * @title JarvisRewards
 * @author joao@usepicnic.com
 *
 * @notice Mints and redeems jTokens using Jarvis Price feed.
 *
 * @dev This contract has 2 main functions:
 *
 * 1. Mint jTokens from Jarvis
 * 2. Redeem jTokens from Jarvis
 *
 */
/// @custom:security-contact hi@usepicnic.com

contract JarvisRewards is IJarvisRewards {

    function claim(
        address tokenAddress,
        address rewardsPool
    ) external override {
        IJarvisRewardsAdapter jarvisRewards = IJarvisRewardsAdapter(rewardsPool);

        uint256 len = jarvisRewards.tokensHeldLength();
        address[] memory tokens = new address[](len);
        for (uint256 i = 0; i < len; i++) {
            tokens[i] = jarvisRewards.tokensHeld(i);
        } 

        uint256 amount = IERC20(tokenAddress).balanceOf(address(this));

        jarvisRewards.claim(amount);

        emit DEFIBASKET_JARVIS_CLAIM(tokens);
    }
}
