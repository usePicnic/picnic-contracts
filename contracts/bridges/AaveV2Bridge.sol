pragma solidity 0.6.12;

import "@uniswap/v2-periphery/contracts/interfaces/IERC20.sol";
import {ILendingPool} from "@aave/protocol-v2/contracts/interfaces/ILendingPool.sol";
import {ILendingPoolAddressesProvider} from "@aave/protocol-v2/contracts/interfaces/ILendingPoolAddressesProvider.sol";
import "hardhat/console.sol";

contract AaveV2Bridge {
    function deposit(
        address aaveLendingPoolAddress,
        address asset
    )
        public
        payable
    {
        ILendingPool _aaveLendingPool = ILendingPool(aaveLendingPoolAddress);
        uint256 balance = IERC20(asset).balanceOf(address(this));
        IERC20(asset).approve(address(_aaveLendingPool), balance);
        _aaveLendingPool.deposit(asset, balance, address(this), 0);
    }

    // function withdraw(
    //     address token,
    //     uint256 amount,
    //     address[] calldata path
    // ) external {
    //     // TODO calculate amount to be cashout
    //     _aaveLendingPool.withdraw(token, amount, msg.sender);
    // }

    // function viewHoldings() external view returns (uint256[] memory) {
    //     return [0];
    // }

    // function viewEthHoldings() external view returns (uint256[] memory) {
    //     return [0];
    // }
}
