// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

interface IGammaDeposit {

    event DEFIBASKET_GAMMA_DEPOSIT(
        uint256 amountA,
        uint256 amountB,
        uint256 lpShares
    );

    event DEFIBASKET_GAMMA_WITHDRAW(
        uint256 lpShares,
        uint256 amountA,
        uint256 amountB
    );

    function deposit(
        address hypervisorAddress,
        address[] calldata tokens,
        uint256[] calldata percentages,
        uint256[4] calldata minAmountsin
    ) external;

    function withdraw(
        address hypervisorAddress, 
        address[] calldata tokens,
        uint256 percentage,
        uint256[4] calldata percentages
    ) external;
    
}