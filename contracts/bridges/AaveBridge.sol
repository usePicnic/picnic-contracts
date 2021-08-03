pragma solidity >=0.8.6;

import "../interfaces/IBridge.sol";

contract AaveBridge is IBridge {
    // TODO instantiate aaveLendingPool
    // constructor(address aaveLendingPoolAddress)

function deposit(address token, address wallet, address[] path) external {
        aaveLendingPool.deposit(token, msg.value, wallet, 0);
    }

    function withdraw(address token, uint256 amount, address wallet, address[] path) external {
        aaveLendingPool.withdraw(token, amount, wallet);
    }

    function viewHoldings() external view returns (uint256[]){
        return [0];
    }

    function viewEthHoldings() external view returns (uint256[]){
        return [0];
    }
}
