// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IVault.sol";
import "../../interfaces/IBalancerLiquidity.sol";
import "hardhat/console.sol";

/**
 * @title BalancerLiquidityBridge
 * @author DeFi Basket
 *
 * @notice Adds/remove liquidity from Balancer pools
 *
 * @dev This contract adds or removes liquidity from Balancer pools through 2 functions:
 *
 * 1. addLiquidity works with multiple ERC20 tokens
 * 2. removeLiquidity works with multiple ERC20 tokens
 *
 */
contract BalancerLiquidityBridge is IBalancerLiquidity {

    address constant balancerV2Address = 0xBA12222222228d8Ba445958a75a0704d566BF2C8;    
    IVault constant _balancerVault = IVault(balancerV2Address);
    

    /**
      * @notice Joins a balancer pool using multiple ERC20 tokens
      *
      * @dev Wraps joinPool and generate the necessary events to communicate with DeFi Basket's UI and back-end.
      *
      * @param tokens Tokens that will have liquidity added to pool. 
      *               Make sure that tokens are sorted numerically by token address. 
      * @param percentages Percentages of the balance of ERC20 tokens that will be added to the pool.
      * @param maxAmountsIn Upper limits for the tokens to send to the pool. 
      *                     Must correspond to the samer order of tokens.
      */
    function addLiquidity(
        bytes32 poolId,
        address[] calldata tokens,
        uint256[] calldata percentages,
        uint256[] calldata maxAmountsIn
    ) external override {

        // Calculate amountsIn array
        // See https://dev.balancer.fi/resources/joins-and-exits/pool-joins#token-ordering for more information
        uint8 numTokens = uint8(tokens.length);
        uint256[] memory amountsIn = new uint256[](numTokens);

        // TODO: Since we are approving exactly amountsIn[i], we may just use the maxAmountsIn array
        for (uint8 i = 0; i < numTokens; i++) { 
            amountsIn[i] = IERC20(tokens[i]).balanceOf(address(this)) * percentages[i] / 100000;
            // Approve 0 first as a few ERC20 tokens are requiring this pattern.
            IERC20(tokens[0]).approve(balancerV2Address, 0);
            IERC20(tokens[0]).approve(balancerV2Address, amountsIn[i]);
        }         
                      
        // See https://dev.balancer.fi/resources/joins-and-exits/pool-joins#userdata for more information
        bytes memory userData = abi.encode(
            IVault.JoinKind.EXACT_TOKENS_IN_FOR_BPT_OUT, 
            amountsIn, 
            0
        );
        IVault.JoinPoolRequest memory request = IVault.JoinPoolRequest(
            tokens, 
            maxAmountsIn, 
            userData, 
            false
        );

        // TODO: Verify if checking for revert is needed
        _balancerVault.joinPool(poolId, address(this), address(this), request);

        // Emit event        
        emit DEFIBASKET_BALANCER_DEPOSIT();
    }

    /**
      * @notice Exits from a balancer pool
      *
      * @dev Wraps exitPool and generate the necessary events to communicate with DeFi Basket's UI and back-end.
      *
      * @param tokens Tokens that will be removed from pool
      * @param percentages Percentages of the balance of ERC20 tokens that will be removed from the pool
      * @param minAmountsOut The lower limits for the tokens to receive. 
      */
    function removeLiquidity(
        bytes32 poolId,
        address[] calldata tokens,
        uint256[] calldata percentages,
        uint256[] calldata minAmountsOut
    ) external override {

        // Calculate amountsOut array
        // See https://dev.balancer.fi/resources/joins-and-exits/pool-joins#token-ordering for more information
        uint8 numTokens = uint8(tokens.length);
        uint256[] memory amountsOut = new uint256[](numTokens);

        for (uint8 i = 0; i < numTokens; i++) { 
            amountsOut[i] = IERC20(tokens[i]).balanceOf(address(this)) * percentages[i] / 100000;
        }              

        // First 20 bytes of poolId is the respective contract address 
        // See https://dev.balancer.fi/resources/pool-interfacing#poolids for more information
        address poolAddress = bytesToAddress(bytes20(poolId));

        // See https://dev.balancer.fi/resources/joins-and-exits/pool-joins#userdata for more information
        bytes memory userData = abi.encode(
            IVault.ExitKind.BPT_IN_FOR_EXACT_TOKENS_OUT, 
            amountsOut, 
            IERC20(poolAddress).balanceOf(address(this))
        );
        IVault.ExitPoolRequest memory request = IVault.ExitPoolRequest(
            tokens, 
            minAmountsOut, 
            userData, 
            false
        );
        
        // Exit entire position. "Could revert due to single exit limit enforced by balancer"
        // TODO: Verify if checking for revert is needed
        _balancerVault.exitPool(poolId, address(this), payable(address(this)), request);        

        // Emit event        
        emit DEFIBASKET_BALANCER_WITHDRAW();        

    }
    

    function bytesToAddress(bytes20 bys) private pure returns (address addr) {
        assembly {
            addr := mload(add(bys,20))
        } 
    }    

}





