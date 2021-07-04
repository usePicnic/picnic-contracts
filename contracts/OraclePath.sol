pragma solidity =0.6.6;

import "hardhat/console.sol";
// TODO import directly from Uniswap instead of creating a file for it
import "./OraclePair.sol";

contract OraclePath {
    uint256 constant ORACLE_UNIT = 1000000000;
    address factory;

    mapping(address => mapping(address => OraclePair)) pathToOracle;

    constructor(address _factory) public {
        factory = _factory;
    }

    // note this will always return 0 before update has been called successfully for the first time.
    function consult(address[] calldata path) external view returns (uint256 amountOut) {
        OraclePair oracle;
        uint256 amount = ORACLE_UNIT;

        for (uint256 i = 0; i < path.length - 1; i++) {
            oracle = pathToOracle[path[i]][path[i + 1]];
            amount = oracle.consult(path[i], amount);
        }
        return amount;
    }

    function updateOracles(address[] calldata path) external {
        OraclePair oracle;
        uint32 elapsedTime;
        for (uint256 i = 0; i < path.length - 1; i++) {
            oracle = pathToOracle[path[i]][path[i + 1]];

            // If Oracle is null -> instantiate
            if (oracle == pathToOracle[address(1)][address(2)]) {
                oracle = new OraclePair(factory, path[i], path[i + 1]);
                pathToOracle[path[i]][path[i + 1]] = oracle;
            }

            // Updates Oracle if enough time has passed
            elapsedTime =  uint32(block.timestamp) - oracle.blockTimestampLast();
            if (elapsedTime > oracle.PERIOD()) {
                 oracle.update();
            }
        }
    }
}
