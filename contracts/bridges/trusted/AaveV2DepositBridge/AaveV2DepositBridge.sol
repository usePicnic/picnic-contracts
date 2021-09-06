pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/ILendingPool.sol";
import "./interfaces/IAaveIncentivesController.sol";
import "../../interfaces/IStake.sol";

/**
 * @title AaveV2DepositBridge
 * @author IndexPool
 *
 * @notice Deposits, withdraws and harvest rewards from Aave's LendingPool contract in Polygon.
 *
 * @dev This contract has 3 main functions:
 *
 * 1. Deposit in Aave's LendingPool (example: DAI -> amDAI)
 * 2. Withdraw from Aave's LendingPool (example: amDAI -> DAI)
 * 3. Harvest rewards from deposits (as of September 2021 being paid in WMATIC, but we can support changes)
 *
 * Notice that we haven't implemented any kind of borrowing mechanisms, mostly because that would require control
 * mechanics to go along with it.
 *
 */

contract AaveV2DepositBridge is IStake {

    address constant aaveLendingPoolAddress = 0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf;
    address constant incentivesControllerAddress = 0x357D51124f59836DeD84c8a1730D72B749d8BC23;

    /**
      * @notice Deposits into the Aave protocol.
      *
      * @dev Wraps the Aave deposit and generate the necessary events to communicate with IndexPool's UI and back-end.
      *
      * @param assetIn Address of the asset to be deposited into the Aave protocol
      * @param percentageIn Percentage of the balance of the asset that will be deposited
      */
    function deposit(address assetIn, uint256 percentageIn) external override {
        ILendingPool _aaveLendingPool = ILendingPool(aaveLendingPoolAddress);

        uint256 amount = IERC20(assetIn).balanceOf(address(this)) * percentageIn / 100000;

        // Approve 0 first as a few ERC20 tokens are requiring this pattern.
        IERC20(assetIn).approve(aaveLendingPoolAddress, 0);
        IERC20(assetIn).approve(aaveLendingPoolAddress, amount);

        _aaveLendingPool.deposit(assetIn, amount, address(this), 0);

        address assetOut = _aaveLendingPool.getReserveData(assetIn).aTokenAddress;

        emit IndexPool_Stake_Deposit(assetIn, amount);
        emit IndexPool_Stake_Withdraw(assetOut, amount);
    }

    /**
      * @notice Withdraws from the Aave protocol.
      *
      * @dev Wraps the Aave withdraw and generate the necessary events to communicate with IndexPool's UI and back-end.
      *
      * @param assetOut Address of the asset to be withdrawn from the Aave protocol
      * @param percentageOut Percentage of the balance of the asset that will be withdrawn
      */
    function withdraw(address assetOut, uint256 percentageOut) external override {
        ILendingPool _aaveLendingPool = ILendingPool(aaveLendingPoolAddress);

        address assetIn = _aaveLendingPool.getReserveData(assetOut).aTokenAddress;
        uint256 amount = IERC20(assetIn).balanceOf(address(this)) * percentageOut / 100000;
        _aaveLendingPool.withdraw(assetOut, amount, address(this));

        emit IndexPool_Stake_Deposit(assetIn, amount);
        emit IndexPool_Stake_Withdraw(assetOut, amount);
    }

    /**
      * @notice Claim rewards from the Aave protocol.
      *
      * @dev Wraps the Aave claim rewards and generate the necessary events to communicate with IndexPool's UI and
      * back-end. Rewards for Polygon are currently in WMATIC, but this might change.
      *
      * @param asset Address of the asset that will be harvested
      */
    function harvest(address asset) external override {
        IAaveIncentivesController distributor = IAaveIncentivesController(incentivesControllerAddress);

        ILendingPool _aaveLendingPool = ILendingPool(aaveLendingPoolAddress);

        // Get aToken address from asset address
        address aToken = _aaveLendingPool.getReserveData(asset).aTokenAddress;
        address[] memory assets = new address[](1);
        assets[0] = aToken;

        // Claim rewards
        uint256 amountToClaim = distributor.getRewardsBalance(assets, address(this));
        uint256 claimedReward = distributor.claimRewards(assets, amountToClaim, address(this));
        address claimedAsset = distributor.REWARD_TOKEN();

        emit IndexPool_Stake_Harvest(claimedAsset, claimedReward);
    }
}
