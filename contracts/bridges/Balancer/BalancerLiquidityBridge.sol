// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IVault.sol";
import "./interfaces/IBasePool.sol";
import "./interfaces/IMerkleOrchard.sol";
import "../interfaces/IBalancerLiquidity.sol";

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
/// @custom:security-contact hi@defibasket.org
contract BalancerLiquidityBridge is IBalancerLiquidity {

    address constant balancerV2Address = 0xBA12222222228d8Ba445958a75a0704d566BF2C8;    
    address constant balancerMerkleOrchard = 0x0F3e0c4218b7b0108a3643cFe9D3ec0d4F57c54e;
    IVault constant _balancerVault = IVault(balancerV2Address);    
    IMerkleOrchard constant _balancerMerkleOrchard = IMerkleOrchard(balancerMerkleOrchard);

    /**
      * @notice Joins a balancer pool using multiple ERC20 tokens
      *
      * @dev Wraps joinPool and generate the necessary events to communicate with DeFi Basket's UI and back-end.
      *
      * @param poolAddress The address of the pool that Wallet will join
      * @param tokens Tokens that will have liquidity added to pool. Should be sorted numerically or Balancer function will revert.
      * @param percentages Percentages of the balance of ERC20 tokens that will be added to the pool.
      * @param minimumBPTout Minimum amount of BPT that will be withdrawn from the pool.
      */
    function addLiquidity(
        address poolAddress, 
        address[] calldata tokens,
        uint256[] calldata percentages,
        uint256 minimumBPTout
    ) external override {

        // Calculate amountsIn array
        // See https://dev.balancer.fi/resources/joins-and-exits/pool-joins#token-ordering for more information
        uint256 numTokens = uint256(tokens.length);

        uint256[] memory amountsIn = new uint256[](numTokens);
        for (uint256 i = 0; i < numTokens; i = unchecked_inc(i)) { 
            amountsIn[i] = IERC20(tokens[i]).balanceOf(address(this)) * percentages[i] / 100_000;
            // Approve 0 first as a few ERC20 tokens are requiring this pattern.
            IERC20(tokens[i]).approve(balancerV2Address, 0);
            IERC20(tokens[i]).approve(balancerV2Address, amountsIn[i]);
        }         
                      
        // See https://dev.balancer.fi/resources/joins-and-exits/pool-joins#userdata for more information
        bytes memory userData = abi.encode(
            IVault.JoinKind.EXACT_TOKENS_IN_FOR_BPT_OUT, 
            amountsIn, 
            minimumBPTout
        );
        IVault.JoinPoolRequest memory request = IVault.JoinPoolRequest(
            tokens, 
            amountsIn, /* maxAmountsIn = amountsIn */
            userData, 
            false 
        );
        
        bytes32 poolId = IBasePool(poolAddress).getPoolId();
        _balancerVault.joinPool(poolId, address(this), address(this), request);

        // First 20 bytes of poolId is the respective contract address 
        // See https://dev.balancer.fi/resources/pool-interfacing#poolids for more information
        //address poolAddress = _bytesToAddress(bytes20(poolId));
        uint256 liquidity = IERC20(poolAddress).balanceOf(address(this));

        // Emit event        
        emit DEFIBASKET_BALANCER_ADD_LIQUIDITY(poolId, amountsIn, liquidity);
    }

    /**
      * @notice Exits from a balancer pool
      *
      * @dev Wraps exitPool and generate the necessary events to communicate with DeFi Basket's UI and back-end.
      *
      * @param poolAddress The address of the pool that Wallet will exit
      * @param percentageOut Percentage of the balance of the asset that will be withdrawn
      * @param minAmountsOut The lower bounds for receiving tokens. Its order should corresponds to the sorted order of the pool's tokens.
      */
    function removeLiquidity(
        address poolAddress,
        uint256 percentageOut,
        uint256[] calldata minAmountsOut
    ) external override {

        // Get LP token amount
        uint256 liquidity = IERC20(poolAddress).balanceOf(address(this)) * percentageOut / 100000;

        // Get pool tokens
        bytes32 poolId = IBasePool(poolAddress).getPoolId();
        (address[] memory tokens, , ) = _balancerVault.getPoolTokens(poolId);
        uint256 numTokens = tokens.length;

        // Compute token balances for emitting difference after exit in the withdraw event
        uint256[] memory tokenBalances = new uint256[](numTokens);
        uint256[] memory tokenAmountsOut = new uint256[](numTokens);
        for(uint256 i = 0; i < numTokens; i = unchecked_inc(i)) {
            tokenBalances[i] = IERC20(tokens[i]).balanceOf(address(this));
        }

        // See https://dev.balancer.fi/resources/joins-and-exits/pool-joins#userdata for more information
        bytes memory userData = abi.encode(
            IVault.ExitKind.EXACT_BPT_IN_FOR_TOKENS_OUT, 
            liquidity
        );
        IVault.ExitPoolRequest memory request = IVault.ExitPoolRequest(
            tokens,
            minAmountsOut, 
            userData, 
            false 
        );

        _balancerVault.exitPool(poolId, address(this), payable(address(this)), request);       
        for(uint256 i = 0; i < numTokens; i = unchecked_inc(i)) {
            tokenAmountsOut[i] = IERC20(tokens[i]).balanceOf(address(this)) - tokenBalances[i];
        }                

        // Emit event        
        emit DEFIBASKET_BALANCER_REMOVE_LIQUIDITY(
            poolId,
            tokens,
            tokenAmountsOut,
            liquidity
        );
    }

    /**
      * @notice Wraps claimDistributions function from Balancer's Merkle Orchard
      *
      * @param claims an array of the claim structs that describes the claim being made. See https://docs.balancer.fi/products/merkle-orchard/claiming-tokens/ for more information.
      * @param tokens an array of the set of all tokens being claimed, referenced by tokenIndex. Tokens can be in any order so long as they are indexed correctly. 
    */
    function claimRewards(IMerkleOrchard.Claim[] calldata claims, address[] calldata tokens) external {
        _balancerMerkleOrchard.claimDistributions(address(this), claims, tokens);
    }
    
    /**
      * @notice Increment integer without checking for overflow - only use in loops where you know the value won't overflow
      *
      * @param i Integer to be incremented
    */
    function unchecked_inc(uint256 i) internal pure returns (uint256) {
        unchecked {
            return i + 1;
        }
    }
}





