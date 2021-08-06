pragma solidity 0.6.12;

import "@uniswap/v2-periphery/contracts/interfaces/IERC20.sol";
import {ILendingPool} from "@aave/protocol-v2/contracts/interfaces/ILendingPool.sol";

contract AaveBridge {
    address private _aaveLendingPoolAddress;
    ILendingPool private _aaveLendingPool;

    constructor(address aaveLendingPoolAddress) public {
        _aaveLendingPoolAddress = aaveLendingPoolAddress;
        _aaveLendingPool = ILendingPool(aaveLendingPoolAddress);
        }

    function deposit(
        address token,
        address[] calldata path
    ) external {
        // ERC20 approval
        uint256 balance = IERC20(token).balanceOf(msg.sender);
        IERC20(token).approve(_aaveLendingPoolAddress, balance);
        _aaveLendingPool.deposit(token, balance, msg.sender, 0);
    }

    function withdraw(
        address token,
        uint256 amount,
        address[] calldata path
    ) external {
        // TODO calculate amount to be cashout
        _aaveLendingPool.withdraw(token, amount, msg.sender);
    }

    // function viewHoldings() external view returns (uint256[] memory) {
    //     return [0];
    // }

    // function viewEthHoldings() external view returns (uint256[] memory) {
    //     return [0];
    // }
}
