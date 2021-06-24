pragma solidity =0.6.6;

import "hardhat/console.sol";
import "./OraclePair.sol";

contract IPOracle {
    uint256 constant ORACLE_UNIT = 1000000000;
    OraclePair oracle; 
    OraclePair[] oracleList;
    address[] path;

    constructor(address factory, address[] memory _path) public { 
        path = _path; 
        oracleList = new OraclePair[](path.length - 1);

        for (uint256 i = 0; i < path.length - 1; i++) {
            oracle = new OraclePair(factory, path[i], path[i + 1]);
            oracle.update();
            oracleList[i] = oracle;
        }
    }
  
    // note this will always return 0 before update has been called successfully for the first time.
    function consult() external view returns (uint amountOut) {
        OraclePair oracle; 
        uint amount = ORACLE_UNIT;

        for (uint256 i = 0; i < oracleList.length; i++) {
            oracle = oracleList[i];
            amount = oracle.consult(path[i], amount);
        }

        return amount;
    }
}