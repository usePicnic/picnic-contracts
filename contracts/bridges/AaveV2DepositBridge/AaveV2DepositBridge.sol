pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/ILendingPool.sol";
import "./interfaces/IAaveIncentivesController.sol";

contract AaveV2DepositBridge {
    event Deposit (
        address assetIn,
        uint256 amount,
        address assetOut
    );
    event Withdraw (
        address assetIn,
        uint256 amount,
        uint256 percentageOut,
        address assetOut
    );

    event Harvest (
        address claimedAsset,
        uint256 claimedReward
    );

    function deposit(address assetIn, uint256 percentage)
    public    
    {
        // Hardcoded to make call easier to understand for the user (UI will help explain/debug it)
        address aaveLendingPoolAddress = 0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf;

        ILendingPool _aaveLendingPool = ILendingPool(aaveLendingPoolAddress);

        uint256 amountIn = IERC20(assetIn).balanceOf(address(this)) * percentage / 100000;
        IERC20(assetIn).approve(aaveLendingPoolAddress, 0);
        IERC20(assetIn).approve(aaveLendingPoolAddress, amountIn);
        _aaveLendingPool.deposit(assetIn, amountIn, address(this), 0);

        address assetOut = _aaveLendingPool.getReserveData(assetIn).aTokenAddress;

        emit Deposit(
            assetIn,
            amountIn,
            assetOut
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

    function withdraw(address assetOut, uint256 percentageOut) public {
        // Hardcoded to make call easier to understand for the user (UI will help explain/debug it)
        address aaveLendingPoolAddress = 0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf;
        ILendingPool _aaveLendingPool = ILendingPool(aaveLendingPoolAddress);

        address assetIn = _aaveLendingPool.getReserveData(assetOut).aTokenAddress;
        uint256 amountIn = IERC20(assetIn).balanceOf(address(this)) * percentageOut / 100000;

        _aaveLendingPool.withdraw(assetOut, amountIn, address(this));

        emit Withdraw(
            assetIn,
            amountIn,
            percentageOut,
            assetOut
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
