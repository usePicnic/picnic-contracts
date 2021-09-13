pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IVault.sol";


contract HarvestFinanceDepositBridge {
    // Hardcoded to make less variables needed for the user to check (UI will help explain/debug it)
    address constant autofarmAddress = 0x89d065572136814230A55DdEeDDEC9DF34EB0B76;
    address constant helperAddress = 0x44C3d2965a369b32ebB2EECa29b2E99E15feC3aE; // address -> poolId
    address constant pAutoAddress = 0x7f426F6Dc648e50464a0392E60E1BB465a67E9cf;
    address constant wMaticAddress = 0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270;

    function deposit(address assetIn, address vaultAddress, uint256 percentageIn) external {
        IVault vault = IVault(vaultAddress);

        uint256 amountIn = IERC20(assetIn).balanceOf(address(this)) * percentageIn / 100000;

        // Approve 0 first as a few ERC20 tokens are requiring this pattern.
        IERC20(assetIn).approve(vaultAddress, 0);
        IERC20(assetIn).approve(vaultAddress, amountIn);

        vault.deposit(amountIn);
    }

    function withdraw(address vaultAddress, uint256 percentageOut) external {
        IVault vault = IVault(vaultAddress);

        uint256 amountOut = IERC20(vaultAddress).balanceOf(address(this)) * percentageOut / 100000;

        // Approve 0 first as a few ERC20 tokens are requiring this pattern.
        IERC20(vaultAddress).approve(vaultAddress, 0);
        IERC20(vaultAddress).approve(vaultAddress, amountOut);

        // TODO should we interact with strategy or whatnot ?
        vault.withdraw(amountOut);
    }
}
