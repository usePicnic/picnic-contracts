pragma solidity 0.6.12;

import "@uniswap/v2-periphery/contracts/interfaces/IERC20.sol";
import {ILendingPool} from "@aave/protocol-v2/contracts/interfaces/ILendingPool.sol";
import {ILendingPoolAddressesProvider} from "@aave/protocol-v2/contracts/interfaces/ILendingPoolAddressesProvider.sol";
import {IAaveIncentivesController} from "../interfaces/IAaveIncentivesController.sol";

import "hardhat/console.sol";

contract AaveV2DepositBridge {
    event Deposit (
        address wallet,
        address asset,
        uint256 amount
    );
    event Withdraw (
        address wallet,
        address asset,
        address[] assets,
        uint256 amount,
        uint256 claimedReward
    );

    function deposit(address asset, uint256 percentage)
        public
        payable
    {
        // Hardcoded to make call easier to understand for the user (UI will help explain/debug it)
        address aaveLendingPoolAddress = 0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf;

        ILendingPool _aaveLendingPool = ILendingPool(aaveLendingPoolAddress);
        uint256 amount = IERC20(asset).balanceOf(address(this)) * percentage / 100000;
        IERC20(asset).approve(aaveLendingPoolAddress, amount);
        _aaveLendingPool.deposit(asset, amount, address(this), 0);

        emit Deposit(
            address(this),
            asset,
            amount
        );
    }

    function withdraw(
        address asset,
        address[] calldata assets,
        address incentivesController,
        uint256 percentage
    ) public payable {
        // Hardcoded to make call easier to understand for the user (UI will help explain/debug it)
        address aaveLendingPoolAddress = 0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf;

        ILendingPool _aaveLendingPool = ILendingPool(aaveLendingPoolAddress);
        IAaveIncentivesController distributor = IAaveIncentivesController(
            incentivesController
        );
        uint256 amountToClaim = distributor.getRewardsBalance(
            assets,
            address(this)
        );
        uint256 claimedReward = distributor.claimRewards(assets, amountToClaim, address(this));

        uint256 balance = IERC20(assets[0]).balanceOf(address(this)) * percentage / 100000;
        _aaveLendingPool.withdraw(asset, balance, address(this));

        emit Withdraw(
            address(this),
            asset,
            assets,
            balance,
            claimedReward
        );
    }

    // function viewHoldings() external view returns (uint256[] memory) {
    //     return [0];
    // }

    // function viewEthHoldings() external view returns (uint256[] memory) {
    //     return [0];
    // }
}
