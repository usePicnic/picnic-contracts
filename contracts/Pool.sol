pragma solidity >=0.8.6;

import "hardhat/console.sol";
import "./interfaces/IPool.sol";
import "./libraries/DataStructures.sol";
import "./nft/IndexPoolNFT.sol";
import "./interfaces/IOraclePath.sol";

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IERC20.sol";

/**
 * @title Pool
 * @author IndexPool
 *
 * @notice Coordinates all index creation, deposits/withdrawals, and fee payments.
 *
 * @dev This contract has 3 main functions:
 *
 * 1. Create indexes
 * 2. Deposit / Withdrawals
 * 3. Control fees due to index creator and IndexPool protocol
 */

contract Pool is IPool {
    address public creator;

    Index[] private _indexes;
    IOraclePath private _oracle;
    IUniswapV2Router02 private _uniswapRouter;
    IndexPoolNFT private _pool721 = new IndexPoolNFT();

    uint256 private constant BASE_ASSET = 1000000000000000000;
    uint256 public maxDeposit = 100 * BASE_ASSET;

    constructor(address uniswapRouter, address oracleAddress) {
        _uniswapRouter = IUniswapV2Router02(uniswapRouter);
        creator = msg.sender;
        _oracle = IOraclePath(oracleAddress);
    }

    modifier _indexpoolOnly_() {
        require(msg.sender == creator, "ONLY INDEXPOOL CAN CALL THIS FUNCTION");
        _;
    }

    event LOG_CREATE_INDEX(
        uint256 indexed indexId,
        address indexed creatorAddress,
        address[] tokens,
        uint256[] allocation
    );

    event LOG_DEPOSIT(
        address indexed userAddress,
        uint256 indexed indexId,
        uint256 amount_in
    );

    event LOG_WITHDRAW(
        address indexed userAddress,
        uint256 indexed indexId,
        uint256 percentage,
        uint256 amount_out
    );

    event LOG_ERC20_WITHDRAW(
        address indexed userAddress,
        uint256 indexed indexId,
        uint256 percentage,
        uint256[] amounts
    );

    event LOG_FEE_WITHDRAW(
        address indexed userAddress,
        uint256 indexed indexId,
        uint256 amountOut
    );

    // TODO Events for Mint / Burn tokens

    event Received(address sender, uint256 amount);

    receive() external payable {// TODO override
        emit Received(msg.sender, msg.value);
    }

    /**
     * @notice Counts how many indexes have been created.
     *
     * @dev Each index is appended into the `indexes` array, so to know how
     * many indexes have been created you only need to check its lenght.
     *
     */
    function getIndexesLength() external view override returns (uint256) {
        return _indexes.length;
    }

    /**
     * @notice Lists all index creators.
     *
     * @dev Creator address is a part of the `Index` struct. So you just need
     * to iterate across indexes and pull the creator address.
     *
     */
    // TODO evaluate if this is being used somewhere.
    function getIndexesCreators()
    external
    view
    override
    returns (address[] memory)
    {
        address[] memory addresses = new address[](_indexes.length);

        for (uint256 i = 0; i < _indexes.length; i++) {
            addresses[i] = _indexes[i].creator;
        }

        return addresses;
    }

    /**
     * @notice List a user balance for a specific token in an specific index.
     *
     * @dev Access the mapping that control holdings for index -> token -> user.
     *
     * @param tokenId Token Id
     * @param tokenAddress Token address
     */
    function getTokenBalance(
        uint256 tokenId,
        address tokenAddress // TODO use token position??
    ) external view override returns (uint256) {
        // TODO Remove uint8 accross contract
        uint256 indexId;
        uint256[] memory allocation;
        (indexId, allocation) = _pool721.viewPool721(tokenId);

        address[] memory tokens = _indexes[indexId].tokens;

        for (uint8 i = 0; i < tokens.length; i++)
        {
            if (tokens[i] == tokenAddress) {
                return allocation[i];
            }
        }
        return 0;
    }

    /**
     * @notice List allocation for tokens.
     *
     * @dev Simply access the `allocation` array in the Index struct, note that
     * order is the same as the `tokens` array.
     *
     * @param indexId Index Id (position in `indexes` array)
     */
    function getIndexAllocation(uint256 indexId)
    external
    view
    override
    returns (uint256[] memory)
    {
        return _indexes[indexId].allocation;
    }

    /**
     * @notice List token addresses.
     *
     * @dev Simply access the `tokens` array in the Index struct.
     *
     * @param indexId Index Id (position in `indexes` array)
     */
    function getIndexTokens(uint256 indexId)
    external
    view
    override
    returns (address[] memory)
    {
        return _indexes[indexId].tokens;
    }

    function getIndex(uint256 indexId)
    external
    view
    override
    returns (Index memory)
    {
        return _indexes[indexId];
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

    /**
     * @notice Creates a new index.
     *
     * @dev Create a new `Index` struct and append it to `indexes`.

     * Token addresses and allocations are set at this moment and will be
     * immutable for the rest of the contract's life.
     *
     * @param allocation Array of allocations (ordered by token addresses)
     * @param tokens Array of token addresses
     * @param paths Paths to be used respective to each token on DEX
     */
    function createIndex(
        address[] memory tokens,
        uint256[] memory allocation,
        address[][] memory paths
    ) external override {
        require(
            allocation.length == tokens.length,
            "MISMATCH IN LENGTH BETWEEN TOKENS AND ALLOCATION"
        );

        require(
            tokens.length <= 32,
            "NO MORE THAN 32 TOKENS ALLOWED IN A SINGLE INDEX"
        );

        require(checkNotDuplicated(tokens), "DUPLICATED TOKENS");
        // import security feature
        address[] memory path;
        address tokenAddress;
        uint256 amount;

        for (uint8 i = 0; i < allocation.length; i++) {
            // Set temp variables
            path = paths[i];
            address[] memory invPath = new address[](path.length);
            tokenAddress = tokens[i];

            if (address(0) != tokenAddress) {
                require(
                    tokenAddress == path[0],
                    "WRONG PATH: TOKEN NEEDS TO BE PART OF PATH"
                );

                // Checks if amount is too small
                amount = _uniswapRouter.getAmountsOut(allocation[i], path)[1];
                require(
                    amount > 100000,
                    "ALLOCATION AMOUNT IS TOO SMALL, NEEDS TO BE AT LEAST EQUIVALENT TO 100,000 WEI"
                );

                // Calculate inverse path and instantiate Oracles
                for (uint8 j = 0; j < path.length; j++) {
                    invPath[path.length - 1 - j] = path[j];
                }
                _oracle.updateOracles(invPath);
            }
        }

        // Get index pointer
        Index storage index = _indexes.push();

        // Set index data
        index.allocation = allocation;
        index.creator = msg.sender;
        index.tokens = tokens;

        emit LOG_CREATE_INDEX(
            _indexes.length - 1,
            creator,
            tokens,
            allocation
        );
    }

    /**
     * @notice Checks if there are duplicates in the tokens array.
     *
     * @dev Internal function to check if there aren't duplicated addresses in the
     * tokens array.
     *
     * @param tokens Array of token addresses
     */
    function checkNotDuplicated(address[] memory tokens)
    internal
    pure
    returns (bool)
    {
        for (uint256 i = 1; i < tokens.length; i++) {
            for (uint256 j = 0; j < i; j++) {
                if (tokens[i] == tokens[j]) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * @notice Deposits ETH and use allocation data to split it between tokens.
     *
     * @dev Deposit basically registers how much of each token needs to be bought
     * according to the amount that was deposited.
     *
     * As per this current version no swaps are made at this point. There will need
     * to be an external call to a buy function in order to execute swaps.
     *
     * @param indexId Index Id (position in `indexes` array)
     * @param paths Paths to be used respective to each token on DEX
     */
    // TODO Refactor deposit -> quotaPrice -> buy
    function deposit(uint256 indexId, address[][] memory paths)
    external
    payable
    override
    {
        require(
            msg.value <= maxDeposit,
            "EXCEEDED MAXIMUM ALLOWED DEPOSIT VALUE"
        );

        require(
            msg.value > BASE_ASSET / 1000,
            "MINIMUM DEPOSIT OF 0.001 MATIC"
        );

        address[] memory tokens = _indexes[indexId].tokens;
        uint256[] memory allocation = _indexes[indexId].allocation;
        uint256[] memory amounts = new uint256[](tokens.length);
        uint256 quotaPrice;

        // Pay fees
        uint256 fee = msg.value / 500;
        _indexes[indexId].fee += fee;

        uint256 freeAmount = msg.value - fee;

        // Decide how much to buy
        (quotaPrice, amounts) = calculateQuotaPrice(allocation, paths, tokens);
        uint256 nQuotas = freeAmount / quotaPrice;

        // TODO check amounts logic in details

        // Go to uniswap
        buy(tokens, amounts, nQuotas,  paths);

        // Mint
        _pool721.generatePool721(msg.sender, indexId, amounts);

        emit LOG_DEPOSIT(msg.sender, indexId, msg.value);
    }

    function calculateQuotaPrice(uint256[] memory allocation, address[][] memory paths, address[] memory tokens)
    internal returns (uint256, uint256[] memory) {
        uint256 quotaPrice = 0;
        uint256[] memory amounts = new uint256[](tokens.length);
        uint amount;
        address[] memory path;

        for (uint8 i = 0; i < allocation.length; i++) {
            path = paths[i];

            require(
                tokens[i] == path[path.length - 1],
                "WRONG PATH: TOKEN NEEDS TO BE PART OF PATH"
            );

            if (address(0) == tokens[i]) {
                amount = allocation[i];
            } else {
                _oracle.updateOracles(path);
                amount = _oracle.consult(path);

                if (amount == 0) {
                    amount = _uniswapRouter.getAmountsOut(allocation[i], path)[
                    path.length - 1
                    ];
                }
            }
            amounts[i] = amount;
            quotaPrice += amount;
        }
        return (quotaPrice, amounts);
    }

    function buy(address[] memory tokens,
        uint256[] memory amounts,
        uint256 nQuotas,
        address[][] memory paths) internal {

        uint256 bought;
        address tokenAddress;
        uint256 amount;
        address[] memory path;
        uint256[] memory result;

        // Register operations
        for (uint8 i = 0; i < tokens.length; i++) {
            tokenAddress = tokens[i];
            amount = amounts[i] * nQuotas;
            path = paths[i];

            if (address(0) != tokens[i]) {
                result = tradeFromETH({
                ethAmount : amount,
                path : path
                });
                bought = result[result.length - 1];
            } else {
                bought = amount;
            }
        }
    }

    /**
     * @notice Withdraw tokens and convert them into ETH.
     *
     * @dev Withdraw basically registers how much of each token needs to be sold
     * according to the amounts that the user holds and the percentage he wants to
     * withdraw.
     *
     * @param tokenId Token Id
     * @param sellPct Percentage of shares to be cashed out (1000 = 100%)
     * @param paths Execution paths
     */
    // TODO figure out how to make partial withdrawals with NFTs (burn, sell, mint new one?)
    function withdraw(
        uint256 tokenId,
        uint256 sellPct,
        address[][] memory paths
    ) external override {
        uint256 ethAmount = 0;
        address[] memory path;
        uint256[] memory result;
        uint256[] memory amounts;
        uint256 indexId;

        require(sellPct > 0, "SELL PCT NEEDS TO BE GREATER THAN ZERO");
        require(sellPct <= 100000, "CAN'T SELL MORE THAN 100% OF FUNDS");

        require(
            _pool721.ownerOf(tokenId) == msg.sender,
            "ONLY CALLABLE BY TOKEN OWNER"
        );

        (indexId, amounts) = _pool721.burnPool721(tokenId);
        address[] memory tokens = _indexes[indexId].tokens;

        for (uint256 i = 0; i < tokens.length; i++) {
            address tokenAddress = tokens[i];
            uint256 sharesAmount = (amounts[i] * sellPct) / 100000;
            amounts[i] -= sharesAmount;

            path = paths[i];

            if (address(0) != tokens[i]) {
                require(
                    tokens[i] == path[0],
                    "WRONG PATH: TOKEN NEEDS TO BE PART OF PATH"
                );

                result = tradeFromTokens({
                fromToken : tokenAddress,
                sharesAmount : sharesAmount,
                path : path
                });
                ethAmount += result[result.length - 1];
            } else {
                ethAmount += sharesAmount;
            }
        }
        payable(msg.sender).transfer(ethAmount);
        emit LOG_WITHDRAW(msg.sender, indexId, sellPct, ethAmount);

        // Mint new NFT
        if (sellPct < 100000 && amounts[0] > 0) {
            _pool721.generatePool721(msg.sender, indexId, amounts);
        }
    }

    /**
     * @notice Uniswap wrapper to trade from ETH to tokens.
     *
     * @dev Sets path of the trade and send the order to Uniswap.
     *
     * @param ethAmount Amount in ETH
     * @param path Uniswap V2 path (trading route)
     */
    function tradeFromETH(
        uint256 ethAmount,
        address[] memory path
    ) private returns (uint256[] memory) {
        return
        _uniswapRouter.swapExactETHForTokens{value : ethAmount}(
            1, // amountOutMin
            path, // path
            address(this), // to
            block.timestamp + 100000 // deadline
        );
    }

    /**
     * @notice Uniswap wrapper to trade from tokens to ETH.
     *
     * @dev Sets path of the trade and send the order to Uniswap.
     *
     * @param fromToken Address of token to be traded
     * @param sharesAmount Amount in token
     */
    function tradeFromTokens(
        address fromToken,
        uint256 sharesAmount,
        address[] memory path
    ) private returns (uint256[] memory) {
        require(
            IERC20(fromToken).approve(address(_uniswapRouter), sharesAmount),
            "approve failed."
        );

        return
        _uniswapRouter.swapExactTokensForETH(
            sharesAmount,
            1, // amountOutMin
            path, // path
            address(this), // to
            block.timestamp + 100000 // deadline
        );
    }

    /**
     * @notice Cash-out ERC20 tokens directly to wallet.
     *
     * @dev This is mostly a safety feature and a way for users to cash-out
     * their ERC20 tokens in case one of the dependencies on this contract
     * goes amiss.
     *
     * @param userAddress Address of user to have ERC20 tokens withdrawn
     * @param tokenId Token Id
     * @param sharesPct Percentage of shares to be cashed out (1000 = 100%)
     */
    // TODO make this compatible with NFT Withdrawals
    function cashOutERC20Internal(
        address userAddress,
        uint256 tokenId,
        uint256 sharesPct
    ) internal {
        uint256 indexId;
        uint256[] memory allocation;
        (indexId, allocation) = _pool721.burnPool721(tokenId);

        address tokenAddress;
        address[] memory tokens = _indexes[indexId].tokens;

        uint256 amount;
        uint256[] memory amounts = new uint256[](tokens.length);

        for (uint256 i = 0; i < tokens.length; i++) {
            tokenAddress = tokens[i];
            amount = (allocation[i] * sharesPct) / 100000;

            require(
                sharesPct <= 100000,
                "INSUFFICIENT FUNDS"
            );

            require(amount > 0, "AMOUNT TO CASH OUT IS TOO SMALL");

            allocation[i] -= amount;

            if (address(0) != tokenAddress) {
                require(
                    IERC20(tokenAddress).approve(address(userAddress), amount),
                    "ERC20 APPROVE FAILED"
                );
                IERC20(tokenAddress).transfer(userAddress, amount);
                amounts[i] = amount;
            } else {
                payable(userAddress).transfer(amount);
            }
        }

        emit LOG_ERC20_WITHDRAW(userAddress, indexId, sharesPct, amounts);

        if (sharesPct < 100000 && allocation[0] > 0) {
            _pool721.generatePool721(msg.sender, indexId, amounts);
        }
    }

    /**
     * @notice Cash-out ERC20 tokens directly to wallet.
     *
     * @dev This is to be used whenever users want to cash out their ERC20 tokens.
     *
     * @param indexId Index Id (position in `indexes` array)
     * @param sharesPct Percentage of shares to be cashed out (1000 = 100%)
     */
    function cashOutERC20(uint256 indexId, uint256 sharesPct)
    external
    override
    {
        cashOutERC20Internal(msg.sender, indexId, sharesPct);
    }

    /**
     * @notice Admin-force cash-out ERC20 tokens directly to wallet.
     *
     * @dev This is a security measure, basically giving us the ability to eject users
     * from the contract in case some vulnerability is found on the withdrawal method.
     *
     * @param indexId Index Id (position in `indexes` array)
     * @param sharesPct Percentage of shares to be cashed out (1000 = 100%)
     */
    function cashOutERC20Admin(
        address user,
        uint256 indexId,
        uint256 sharesPct
    ) external override _indexpoolOnly_ {
        cashOutERC20Internal(user, indexId, sharesPct);
    }

    /**
     * @notice Get Pool721 (NFT contract) address.
     *
     * @dev Get the address of the NFT contract minted by this Pool.
     */
    function getPortfolioNFTAddress() external view override returns (address) {
        return address(_pool721);
    }

    /**
     * @notice Pay creator fee.
     *
     * @dev Only callable by the creator. Cashes out ETH funds that are due to
     * a 0.1% in all deposits on the created index.
     *
     * @param indexId Index Id (position in `indexes` array)
     */
    function payCreatorFee(uint256 indexId) external override {
        require(
            msg.sender == _indexes[indexId].creator,
            "ONLY INDEX CREATOR CAN WITHDRAW FEES"
        );

        uint256 creatorFee = _indexes[indexId].fee / 2;
        uint256 withdrawAmount = creatorFee - _indexes[indexId].creatorFeeCashOut;

        require(withdrawAmount > 0, "NO FEE TO WITHDRAW");

        _indexes[indexId].creatorFeeCashOut += withdrawAmount;

        payable(msg.sender).transfer(withdrawAmount);
        emit LOG_FEE_WITHDRAW(msg.sender, indexId, withdrawAmount);
    }

    /**
     * @notice Reads available creator fee.
     *
     * @dev Check how much is owed to the creator.
     *
     * @param indexId Index Id (position in `indexes` array)
     */
    function getAvailableCreatorFee(uint256 indexId)
    external
    view
    override
    returns (uint256)
    {
        uint256 creatorFee = _indexes[indexId].fee / 2;
        uint256 creatorAvailableFee = creatorFee - _indexes[indexId].creatorFeeCashOut;

        return creatorAvailableFee;
    }

    /**
     * @notice Pay protocol fee.
     *
     * @dev Only callable by the protocol creator. Cashes out ETH funds that are due to
     * a 0.1% in all deposits on the created index.
     *
     * @param indexId Index Id (position in `indexes` array)
     */
    function payProtocolFee(uint256 indexId)
    external
    override
    _indexpoolOnly_
    {
        uint256 protocolFee = _indexes[indexId].fee / 2;
        uint256 withdrawAmount = protocolFee -
        _indexes[indexId].protocolFeeCashOut;

        require(withdrawAmount > 0, "NO FEE TO WITHDRAW");

        _indexes[indexId].protocolFeeCashOut += withdrawAmount;

        payable(msg.sender).transfer(withdrawAmount);
        emit LOG_FEE_WITHDRAW(msg.sender, indexId, withdrawAmount);
    }

    /**
     * @notice Reads available protocol fee.
     *
     * @dev Check how much is owed to the protocol.
     *
     * @param indexId Index Id (position in `indexes` array)
     */
    function getAvailableProtocolFee(uint256 indexId)
    external
    view
    override
    returns (uint256)
    {
        uint256 protocolFee = _indexes[indexId].fee / 2;
        uint256 protocolAvailableFee = protocolFee - _indexes[indexId].protocolFeeCashOut;

        return protocolAvailableFee;
    }
}
