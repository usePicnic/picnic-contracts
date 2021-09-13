pragma solidity ^0.8.6;

import "./interfaces/IVault.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AdamantFinanceDepositBridge {
    function deposit(address assetIn, uint256 percentageIn, address vaultAddress, address rewardAddress) external {
        uint256 amount = IERC20(assetIn).balanceOf(address(this)) * percentageIn / 100000;

        // Approve 0 first as a few ERC20 tokens are requiring this pattern.
        IERC20(assetIn).approve(vaultAddress, 0);
        IERC20(assetIn).approve(vaultAddress, amount);

        IVault(vaultAddress).deposit(amount);

//        IStake(rewardAddress).stake(rewardAddress);
    }

    function withdraw(address assetIn, address vaultAddress, uint256 percentageIn) external {
        uint256 amount = IERC20(assetIn).balanceOf(address(this)) * percentageIn / 100000;

//        IStake(rewardAddress).withdraw();

        // Approve 0 first as a few ERC20 tokens are requiring this pattern.
        IERC20(assetIn).approve(vaultAddress, 0);
        IERC20(assetIn).approve(vaultAddress, amount);

        IVault(vaultAddress).withdraw(amount);

    }
}
