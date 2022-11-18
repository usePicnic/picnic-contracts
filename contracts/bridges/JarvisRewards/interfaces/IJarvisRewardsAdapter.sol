// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

interface IJarvisRewardsAdapter{    
    function claim(uint256 _rwdAmount) external;

    function tokensHeldLength() external returns (uint256);
    
    function tokensHeld(uint256) external returns (address);
}
