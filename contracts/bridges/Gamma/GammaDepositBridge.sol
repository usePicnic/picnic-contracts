// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "../interfaces/IGammaDeposit.sol";
import "./interfaces/IHypervisorRouter.sol";
import "./interfaces/IHypervisor.sol";

contract GammaDepositBridge is IGammaDeposit {
    function _approveTokens(
        address hypervisorAddress, 
        address[] calldata tokens, 
        uint256[] calldata percentages) 
    internal returns (uint256[] memory) {
        uint256 numTokens = uint256(tokens.length);
        uint256[] memory amountsIn = new uint256[](numTokens);

        for (uint256 i = 0; i < tokens.length; i++) { 
            amountsIn[i] = IERC20(tokens[i]).balanceOf(address(this)) * percentages[i] / 100_000;
            IERC20(tokens[i]).approve(hypervisorAddress, 0);
            IERC20(tokens[i]).approve(hypervisorAddress, amountsIn[i]);
        }   
        
        return amountsIn;  
    }

    function deposit(
        address hypervisorAddress,
        address[] calldata tokens,
        uint256[] calldata percentages,
        uint256[4] calldata minAmountsin
    ) external override {       
        IHypervisorRouter hypervisorRouter = IHypervisorRouter(IHypervisor(hypervisorAddress).whitelistedAddress());

        uint256[] memory amountsIn = _approveTokens(hypervisorAddress, tokens, percentages);

        (uint256 depositA, uint256 depositB) = capRatios(tokens, amountsIn, hypervisorAddress, hypervisorRouter);

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
        address[] calldata tokens, 
        uint256[] memory amountsIn, 
        address hypervisorAddress,
        IHypervisorRouter hypervisorRouter
    ) internal view returns (uint256, uint256) {    
        (uint256 startB, uint256 endB) = hypervisorRouter.getDepositAmount(
            hypervisorAddress,
            tokens[0],
            amountsIn[0]            
        );

        (uint256 startA, uint256 endA) = hypervisorRouter.getDepositAmount(
            hypervisorAddress,
            tokens[1],
            amountsIn[1]            
        );    

        // * 9999 / 10000 is a hack to deal with unprecise math and avoid "improper ratio bug")
        if (startA > amountsIn[0]) {
            return (amountsIn[0], Math.min(amountsIn[1], endB * 9999/10000 ));
        } 
        else if (startB > amountsIn[1]) {
            return (Math.min(amountsIn[0], endA * 9999/10000 ), amountsIn[1]);
        } 
        else {
            return (Math.min(amountsIn[0], endA * 9999/10000 ), Math.min(amountsIn[1], endB * 9999/10000 ));
        }        
    }    
}
