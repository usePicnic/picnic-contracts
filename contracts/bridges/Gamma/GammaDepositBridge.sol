// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "../interfaces/IGammaDeposit.sol";
import "./interfaces/IHypervisorRouter.sol";
import "./interfaces/IHypervisor.sol";

contract GammaDepositBridge is IGammaDeposit {
    address constant hypervisorRouterAddress = 0xe0A61107E250f8B5B24bf272baBFCf638569830C;
    IHypervisorRouter constant hypervisorRouter = IHypervisorRouter(hypervisorRouterAddress);

    function deposit(
        address hypervisorAddress,
        address[] calldata tokens,
        uint256[] calldata percentages,
        uint256[4] calldata minAmountsin
    ) external override {
        uint256 numTokens = uint256(tokens.length);
        uint256[] memory amountsIn = new uint256[](numTokens);

        for (uint256 i = 0; i < numTokens; i++) {
            amountsIn[i] = IERC20(tokens[i]).balanceOf(address(this)) * percentages[i] / 100_000;
            // Approve 0 first as a few ERC20 tokens are requiring this pattern.
            IERC20(tokens[i]).approve(hypervisorAddress, 0);
            IERC20(tokens[i]).approve(hypervisorAddress, amountsIn[i]);
        }

        (uint256 depositA, uint256 depositB) = capRatios(amountsIn, hypervisorAddress);

        uint256 amountOut = hypervisorRouter.deposit(
            depositA,
            depositB,
            address(this),
            hypervisorAddress,
            minAmountsin
        );

        emit DEFIBASKET_GAMMA_DEPOSIT(amountsIn[0], amountsIn[1], amountOut);
    }

    function withdraw(
        address hypervisorAddress,
        address[] calldata tokens,
        uint256 percentage,
        uint256[4] calldata minAmountsIn
    ) external override {
        IHypervisor hypervisor = IHypervisor(hypervisorAddress);

        uint256 amountIn = hypervisor.balanceOf(address(this)) * percentage / 100_000;

        (uint256 amountA, uint256 amountB) = hypervisor.withdraw(
            amountIn,
            address(this),
            address(this),
            minAmountsIn
        );

        emit DEFIBASKET_GAMMA_WITHDRAW(amountIn, amountA, amountB);
    }

    function capRatios(
        uint256[] memory amountsIn,
        address hypervisorAddress
    ) internal view returns (uint256, uint256) {
        IHypervisor hypervisor = IHypervisor(hypervisorAddress);
        uint256 _tmpA;
        uint256 _tmpB;

        (_tmpA, _tmpB) = hypervisor.getTotalAmounts();

        uint256 ratioA; 
        uint256 ratioB; 

        if (_tmpA > _tmpB) {
            ratioA = _tmpA * 1_000_000 / _tmpB;
            ratioB = amountsIn[0] * 1_000_000 / amountsIn[1];

            if (ratioA > ratioB) {
                return (amountsIn[0], amountsIn[1] * ratioB / ratioA);
            } else {
                return (amountsIn[0] * ratioA / ratioB, amountsIn[1]);
            }
        } else {
            ratioA = _tmpB * 1_000_000 / _tmpA;
            ratioB = amountsIn[1] * 1_000_000 / amountsIn[0];

            if (ratioA > ratioB) {
                return (amountsIn[0] * ratioB / ratioA, amountsIn[1]);
            } else {
                return (amountsIn[0], amountsIn[1] * ratioA / ratioB);
            }
        }
    }
}
