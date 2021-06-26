pragma solidity >=0.8.6;

import "./IndexPoolNFT.sol";
import "./IndexPool.sol";
import "./interfaces/IOraclePath.sol";
import "./interfaces/IIndexPoolFactory.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

contract IndexpoolFactory is IIndexpoolFactory{
    address public creator;
    address[] private _indexes;
    IOraclePath public oracle;
    IUniswapV2Router02 public uniswapRouter;

    uint256 private constant BASE_ASSET = 1000000000000000000;
    uint256 public maxDeposit = BASE_ASSET;

    IndexPoolNFT _NFTFactory = new IndexPoolNFT();

    event LOG_CREATE_INDEX(
        uint256 indexed indexId,
        address indexed creatorAddress,
        address[] tokens,
        uint256[] allocation
    );

    modifier _indexpoolOnly_() {
        require(msg.sender == creator, "ONLY INDEXPOOL CAN CALL THIS FUNCTION");
        _;
    }

    constructor(address uniswapRouter, address oracleAddress) {
        uniswapRouter = IUniswapV2Router02(uniswapRouter);
        creator = msg.sender;
        oracle = IOraclePath(oracleAddress);
    }

    function createIndex(
        address[] memory tokens,
        uint256[] memory allocation,
        address[][] memory paths
    ) external override {
        IndexPool memory indexPool = new IndexPool(tokens, allocation, paths);

        _indexes.push(address(indexPool));

        emit LOG_CREATE_INDEX(
            _indexes.length - 1,
            msg.sender,
            tokens,
            allocation
        );
    }

    /**
   * @notice Set max deposit (guarded launch).
   *
   * @dev Created to minimize damage in case any vulnerability is found on the
   * contract.
   *
   * @param newMaxDeposit Max deposit value in wei
   */
    function setMaxDeposit(uint256 newMaxDeposit)
    external
    override
    _indexpoolOnly_
    {
        maxDeposit = newMaxDeposit;
    }
}
