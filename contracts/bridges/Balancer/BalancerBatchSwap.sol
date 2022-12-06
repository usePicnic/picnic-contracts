// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;


import "./interfaces/IVault.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


contract BalancerBatchSwap {
    address constant balancerV2Address = 0xBA12222222228d8Ba445958a75a0704d566BF2C8;    
    IVault constant _balancerVault = IVault(balancerV2Address);   
function batchSwap(
        bytes32 poolId, 
        uint256 percentageIn,    
        address[] calldata assets,
        int256[] calldata limits
    ) external  {
        uint256 amountIn = IERC20(assets[0]).balanceOf(address(this)) * percentageIn / 100000;

        IERC20(assets[0]).approve(balancerV2Address, 0);
        IERC20(assets[0]).approve(balancerV2Address, amountIn);

        IVault.BatchSwapStep[] memory batchSwapSteps = new IVault.BatchSwapStep[](1);
        batchSwapSteps[0] = IVault.BatchSwapStep(
            poolId, // poolId
            0, // assetInIndex
            1, // assetOutIndex
            amountIn, // amount
            "0x" // userData
        );   

        IVault.FundManagement memory funds = IVault.FundManagement(
            address(this), // sender
            false, // fromInternalBalance
            payable(address(this)), // recipient
            false // toInternalBalance
        );

        _balancerVault.batchSwap(
            IVault.SwapKind.GIVEN_IN,
            batchSwapSteps,
            assets,
            funds,
            limits,
            block.timestamp + 100000
        );
    }
    }