pragma solidity 0.6.12;

import "@uniswap/v2-periphery/contracts/interfaces/IERC20.sol";
import {ILendingPool} from "@aave/protocol-v2/contracts/interfaces/ILendingPool.sol";
import {ILendingPoolAddressesProvider} from "@aave/protocol-v2/contracts/interfaces/ILendingPoolAddressesProvider.sol";
import {IAaveIncentivesController} from "../interfaces/IAaveIncentivesController.sol";

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
        IERC20(asset).approve(aaveLendingPoolAddress, balance);
        _aaveLendingPool.deposit(asset, balance, address(this), 0);
    }

     function withdraw(
         address aaveLendingPoolAddress,
         address asset
     ) public payable {
         ILendingPool _aaveLendingPool = ILendingPool(aaveLendingPoolAddress);
         IAaveIncentivesController distributor = IAaveIncentivesController(0x357D51124f59836DeD84c8a1730D72B749d8BC23);
         address[] memory assets = [asset];
         uint256 amountToClaim = distributor.getRewardsBalance(assets, address(this));
         console.log(amountToClaim);
         distributor.claimRewards(assets, amountToClaim, address(this));
         // TODO calculate amount to be cashout
         _aaveLendingPool.withdraw(asset, 1000, address(this));
     }

    // function viewHoldings() external view returns (uint256[] memory) {
    //     return [0];
    // }

    // function viewEthHoldings() external view returns (uint256[] memory) {
    //     return [0];
    // }
}
