// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

interface IClearpoolDeposit {
    event DEFIBASKET_CLEARPOOL_DEPOSIT(
        address assetIn,
        uint256 amountIn,
        uint256 poolTokenReceived
    );

    event DEFIBASKET_CLEARPOOL_WITHDRAW(
        uint256 burnAmount,
        address assetReceived,
        uint256 amountReceived
    );

    event DEFIBASKET_CLEARPOOL_CLAIM(
        address rewardTokenAddress,
        uint256 rewardTokenBalanceOut
    );

    function deposit(address poolAddress, uint256 percentageIn) external;
    function withdraw(address poolAddress, uint256 percentageOut) external;
    function claimRewards(address poolAddress, address factoryAddress) external;

}