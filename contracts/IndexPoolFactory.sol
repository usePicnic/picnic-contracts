pragma solidity >=0.8.6;

import "./IndexPool.sol"; // TODO import interface


contract IndexPoolFactory {
    address public creator;
    address[] private _indexes;
    PortfolioNFT _NFTFactory = new NFTFactory();

    PortfolioNFT private _pool721;
    IOraclePath private _oracle;
    IUniswapV2Router02 private _uniswapRouter;

    uint256 private constant BASE_ASSET = 1000000000000000000;
    uint256 public maxDeposit = BASE_ASSET;

    constructor(address uniswapRouter, address oracleAddress) {
        _uniswapRouter = IUniswapV2Router02(uniswapRouter);
        creator = msg.sender;
        _pool721 = new Pool721();
        _oracle = IOraclePath(oracleAddress);
    }

    modifier _indexpoolOnly_() {
        require(msg.sender == creator, "ONLY INDEXPOOL CAN CALL THIS FUNCTION");
        _;
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
   * @param _max_deposit Max deposit value in wei
   */
    function setMaxDeposit(uint256 newMaxDeposit)
    external
    override
    _indexpool_only_
    {
        maxDeposit = newMaxDeposit;
    }
}
