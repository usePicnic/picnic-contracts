pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

// TODO should we be using IERC20 from uniswap instead of openzeppelin ? why ?
import "@uniswap/v2-periphery/contracts/interfaces/IERC20.sol";
import {ILendingPool} from "@aave/protocol-v2/contracts/interfaces/ILendingPool.sol";
import {ILendingPoolAddressesProvider} from "@aave/protocol-v2/contracts/interfaces/ILendingPoolAddressesProvider.sol";
import {IAaveIncentivesController} from "../interfaces/IAaveIncentivesController.sol";
import "hardhat/console.sol";

contract AaveV2DepositBridge {
    event Deposit (
        address assetIn,
        uint256 amountIn,
        address assetOut,
        uint256 amountOut
    );
    event Withdraw (
        address assetIn,
        uint256 amountIn,
        address assetOut,
        uint256 amountOut
    );

    // TODO is it necessary to have a harvest event? harvest might just be a different kind of withdraw
    event Harvest (
        address claimedAsset,
        uint256 claimedReward
    );

    function deposit(address assetIn, uint256 percentage)
    public
    payable
    {
        // Hardcoded to make call easier to understand for the user (UI will help explain/debug it)
        address aaveLendingPoolAddress = 0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf;

        ILendingPool _aaveLendingPool = ILendingPool(aaveLendingPoolAddress);

        uint256 amountIn = IERC20(assetIn).balanceOf(address(this)) * percentage / 100000;
        IERC20(assetIn).approve(aaveLendingPoolAddress, amountIn);
        _aaveLendingPool.deposit(assetIn, amountIn, address(this), 0);

        address assetOut = _aaveLendingPool.getReserveData(assetIn).aTokenAddress;
        uint256 amountOut = IERC20(assetOut).balanceOf(address(this));
        // TODO do final balance - initial balance

        emit Deposit(
            assetIn,
            amountIn,
            assetOut,
            amountOut
        );
    }

    function harvest(address asset) public
    {
        address incentivesControllerAddress = 0x357D51124f59836DeD84c8a1730D72B749d8BC23;
        IAaveIncentivesController distributor = IAaveIncentivesController(
            incentivesControllerAddress
        );

        address aaveLendingPoolAddress = 0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf;
        ILendingPool _aaveLendingPool = ILendingPool(aaveLendingPoolAddress);
        address aToken = _aaveLendingPool.getReserveData(asset).aTokenAddress;

        address[] memory assets = new address[](1);
        assets[0] = aToken;

        uint256 amountToClaim = distributor.getRewardsBalance(
            assets,
            address(this)
        );
        uint256 claimedReward = distributor.claimRewards(assets, amountToClaim, address(this));

        address claimedAsset = distributor.REWARD_TOKEN();

        emit Harvest(claimedAsset, claimedReward);
    }

    function withdraw(address assetOut, uint256 percentageOut) public payable {
        // Hardcoded to make call easier to understand for the user (UI will help explain/debug it)
        address aaveLendingPoolAddress = 0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf;
        ILendingPool _aaveLendingPool = ILendingPool(aaveLendingPoolAddress);

        uint256 amountOut = IERC20(assetOut).balanceOf(address(this)) * percentageOut / 100000;
        _aaveLendingPool.withdraw(assetOut, amountOut, address(this));

        address assetIn = _aaveLendingPool.getReserveData(assetOut).aTokenAddress;

        // TODO do final balance - initial balance
        uint256 amountIn = IERC20(assetIn).balanceOf(address(this));

        emit Withdraw(
            assetIn,
            amountIn,
            assetOut,
            amountOut
        );
    }

    // TODO write view functions
    // function viewHoldings() external view returns (uint256[] memory) {
    //     return [0];
    // }

    // function viewEthHoldings() external view returns (uint256[] memory) {
    //     return [0];
    // }
}
