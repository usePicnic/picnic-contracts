pragma solidity >=0.8.6;

contract IndexPoolFactory {
    address public creator;
    IndexPool[] private _indexes;

    _portfolioNFTFactory = new PortfolioNFTFactory();


constructor(address uniswapRouter, address oracleAddress) {
        _uniswapRouter = IUniswapV2Router02(uniswapRouter);
        creator = msg.sender;
        _pool721 = new Pool721();
        _oracle = IOraclePath(oracleAddress);
    }

    function createIndex(
        address[] memory tokens,
        uint256[] memory allocation,
        address[][] memory paths
    ) external override {
        // Get index pointer
        IndexPool memory indexPool = new IndexPool(tokens, allocation, paths);

        _indexes.push(indexPool);

        emit LOG_CREATE_INDEX(
            _indexes.length - 1,
            msg.sender,
            tokens,
            allocation
        );
    }
}
