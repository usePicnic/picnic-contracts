pragma solidity =0.6.6;

import "hardhat/console.sol";
import "./OraclePair.sol";

contract IPOracle {
    uint256 constant ORACLE_UNIT = 1000000000;
    address factory;

    mapping(address => mapping(address => OraclePair)) pathToOracle;

    constructor(address _factory) public { 
        factory = _factory;
    }
  
    // note this will always return 0 before update has been called successfully for the first time.
    function consult(address[] memory path) public returns (uint amountOut) {
        OraclePair oracle; 
        uint amount = ORACLE_UNIT;

        for (uint256 i = 0; i < path.length - 1; i++) {
            oracle = pathToOracle[path[i]][path[i + 1]];

            if (oracle == pathToOracle[address(1)][address(2)]){
                console.log('ORACLE ZERO');
                oracle = instantiateOracle(path[i], path[i + 1]);
            }

            amount = oracle.consult(path[i], amount);
        }

        console.log(amount);

        return amount;
    }

    function instantiateOracle(address tokenA, address tokenB) public returns (OraclePair) {
         OraclePair oracle = new OraclePair(factory, tokenA, tokenB);
         oracle.update();
         pathToOracle[tokenA][tokenB] = oracle;
         return oracle;
    }
}