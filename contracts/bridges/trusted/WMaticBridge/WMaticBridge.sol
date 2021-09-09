pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IWMatic.sol";

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

contract WMATICBridge {
    address constant wMaticAddress = 0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270;
    IWMatic constant wmatic = IWMatic(wMaticAddress);


    function wrap(uint256 percentageIn) external {
        wmatic.deposit{value: address(this).balance * percentageIn / 100000}();
    }


    function unwrap(uint256 percentageOut) external {
        wmatic.withdraw(IERC20(wMaticAddress).balanceOf(address(this)) * percentageOut / 100000);
    }
}
