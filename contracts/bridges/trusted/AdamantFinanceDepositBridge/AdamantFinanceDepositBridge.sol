pragma solidity ^0.8.6;
import "./interfaces/IVault.sol";


contract AdamantFinanceDepositBridge {
    address constant adamantFinanceAddress = 0xF7661EE874Ec599c2B450e0Df5c40CE823FEf9d3;
    IAdamant constant adamant = IVault(adamantFinanceAddress);

    function deposit(address assetIn, address vaultAddress, uint256 percentageIn){
        uint256 amount = IERC20(assetIn).balanceOf(address(this)) * percentageIn / 100000;

        // Approve 0 first as a few ERC20 tokens are requiring this pattern.
        IERC20(assetIn).approve(adamantFinanceAddress, 0);
        IERC20(assetIn).approve(adamantFinanceAddress, amount);

        IVault(vaultAddress).deposit(amount);
    }

    function withdraw(address assetIn, uint256 percentageIn){
        uint256 amount = IERC20(assetIn).balanceOf(address(this)) * percentageIn / 100000;

        // Approve 0 first as a few ERC20 tokens are requiring this pattern.
        IERC20(assetIn).approve(adamantFinanceAddress, 0);
        IERC20(assetIn).approve(adamantFinanceAddress, amount);

        IVault(vaultAddress).withdraw(amount);
    }
}
