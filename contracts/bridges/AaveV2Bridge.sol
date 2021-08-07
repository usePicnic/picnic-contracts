pragma solidity 0.6.12;

import "@uniswap/v2-periphery/contracts/interfaces/IERC20.sol";
import {ILendingPool} from "@aave/protocol-v2/contracts/interfaces/ILendingPool.sol";
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
        uint256 balance;
        balance = IERC20(asset).balanceOf(msg.sender);
        console.log("balance before",balance);
        IERC20(asset).approve(address(_aaveLendingPool), balance);
        console.log("approved!");
        console.log("asset",asset);
        _aaveLendingPool.deposit(asset, balance, msg.sender, 0);
        console.log("deposited!");
        balance = IERC20(asset).balanceOf(msg.sender);
        console.log("balance after",balance);
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
