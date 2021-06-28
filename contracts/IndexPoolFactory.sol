pragma solidity >=0.8.6;
import "hardhat/console.sol";

import "./IndexPool.sol";
import "./interfaces/IIndexPoolFactory.sol";

contract IndexpoolFactory is IIndexpoolFactory {
    address public creator;
    address[] private _indexes;
    address public oracleAddress;
    address public uniswapRouterAddress;
    address public nftFactoryAddress;

    uint256 private constant BASE_ASSET = 1000000000000000000;
    uint256 public maxDeposit = BASE_ASSET;

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

    constructor(address _uniswapRouterAddress, address _oracleAddress, address _nftFactoryAddress) {
        uniswapRouterAddress = _uniswapRouterAddress;
        oracleAddress = _oracleAddress;
        nftFactoryAddress = _nftFactoryAddress;

        creator = msg.sender;
    }

    function createIndex(
        address[] memory tokens,
        uint256[] memory allocation,
        address[][] memory paths
    ) external override {
        address indexPoolAddress = address(
            new IndexPool(
                address(this),
                tokens,
                allocation,
                paths,
                oracleAddress,
                uniswapRouterAddress,
                nftFactoryAddress
            ));
        _indexes.push(indexPoolAddress);

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

    function getCreator() external override returns (address){
        return creator;
    }

    function getMaxDeposit() external override returns (uint256){
        return maxDeposit;
    }

    function getIndexesLength() external view returns (uint256){
        return _indexes.length;
    }
}
