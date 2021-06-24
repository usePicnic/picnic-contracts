pragma solidity =0.6.6;
import "hardhat/console.sol";
import "./OraclePair.sol";
contract IPOracle {

    constructor(address factory, address[] _path) public { 
        OraclePair oracle; 

        uint256 constant ORACLE_UNIT = 1000000000

        path = _path; 
        oracleList = new IUniswapV2Pair[](path.length - 1);

        for (uint256 i = 0; i < path.length - 1; i++) {
            oracle = OraclePair(factory, path[i], path[i + 1]);
            oracle.update();
            oracleList.push(oracle);
        }
    }
  
    // note this will always return 0 before update has been called successfully for the first time.
    function consult() external view returns (uint amountOut) {
        OraclePair oracle; 
        uint amount = ORACLE_UNIT;

        for (uint256 i = 0; i < oracleList.length; i++) {
            oracle = oracleList[i];
            amount = oracle.consult(path[i], amountIn);
        }

        return amount;
    }
}