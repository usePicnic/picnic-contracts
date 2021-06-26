pragma solidity >=0.8.6;

import "hardhat/console.sol";
import "./interfaces/IIndexPool.sol";
import "./interfaces/IIndexPoolFactory.sol";
import "./libraries/DataStructures.sol";
import "./IndexPoolNFT.sol";

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

contract IndexPool is IIndexPool {
    IIndexpoolFactory _indexpoolFactory;
    address public creator;
    uint256[] public allocation;
    address[] public tokens;
    uint256 public fee;
    uint256 public creatorFeeCashOut;
    uint256 public protocolFeeCashOut;
    mapping(address => mapping(address => uint256)) private _shares; // Token address -> user address -> shares

    uint256 private constant BASE_ASSET = 1000000000000000000;

    event LOG_DEPOSIT(
        address indexed userAddress,
        uint256 amount_in
    );

    event LOG_WITHDRAW(
        address indexed userAddress,
        uint256 percentage,
        uint256 amount_out
    );

    event LOG_ERC20_WITHDRAW(
        address indexed userAddress,
        uint256 percentage,
        uint256[] amounts
    );

    event LOG_FEE_WITHDRAW(
        address indexed userAddress,
        uint256 amountOut
    );

    event Received(address sender, uint256 amount);

    receive() external payable override {
        emit Received(msg.sender, msg.value);
    }

    modifier _indexpoolOnly_() {
        require(msg.sender == _indexpoolFactory.creator, "ONLY INDEXPOOL CAN CALL THIS FUNCTION");
        _;
    }

    constructor(
        address indexpoolFactoryAddress,
        address[] _tokens,
        uint256[] _allocation,
        address[][] paths)
    {
        creator = msg.sender;
        tokens = _tokens;
        allocation = _allocation;

        checkValidIndex(paths);

        _indexpoolFactory = IIndexpoolFactory(indexpoolFactoryAddress);
    }

    function checkValidIndex(address[][] paths) internal {
        require(allocation.length == tokens.length,
            "MISMATCH IN LENGTH BETWEEN TOKENS AND ALLOCATION");

        require(tokens.length <= 32,
            "NO MORE THAN 32 TOKENS ALLOWED IN A SINGLE INDEX");

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
                amount = _indexpoolFactory.uniswapRouter.getAmountsOut(allocation[i], path)[1];
                require(
                    amount > 100000,
                    "ALLOCATION AMOUNT IS TOO SMALL, NEEDS TO BE AT LEAST EQUIVALENT TO 100,000 WEI"
                );

                // Calculate inverse path and instantiate Oracles
                for (uint8 j = 0; j < path.length; j++) {
                    invPath[path.length - 1 - j] = path[j];
                }
                _indexpoolFactory.oracle.updateOracles(invPath);
            }
        }
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
     * @param paths Paths to be used respective to each token on DEX
     */
    function deposit(address[][] memory paths)
    external
    payable
    override
    {
        require(
            msg.value <= _indexpoolFactory.maxDeposit(),
            "EXCEEDED MAXIMUM ALLOWED DEPOSIT VALUE"
        );

        require(
            msg.value > BASE_ASSET / 1000,
            "MINIMUM DEPOSIT OF 0.001 MATIC"
        );

        uint256[] memory amounts = new uint256[](tokens.length);
        uint256 quotaPrice;

        // Pay fees
        uint256 depositFee = msg.value / 500;
        fee += depositFee;

        uint256 freeAmount = msg.value - depositFee;
        (quotaPrice, amounts) = calculateQuotaPrice(allocation, paths, tokens);
        uint256 nQuotas = freeAmount / quotaPrice;

        buy(nQuotas, amounts, paths);

        emit LOG_DEPOSIT(msg.sender, msg.value);
    }

    function calculateQuotaPrice(address[][] memory paths)
    internal returns (uint256, uint256[]) {
        uint256 amount;
        uint256 quotaPrice = 0;
        address[] memory path;
        uint256[] memory amounts = new uint256[](tokens.length);

        for (uint8 i = 0; i < allocation.length; i++) {
            path = paths[i];

            require(
                tokens[i] == path[path.length - 1],
                "WRONG PATH: TOKEN NEEDS TO BE PART OF PATH"
            );

            if (address(0) == tokens[i]) {
                amount = allocation[i];
            } else {
                _indexpoolFactory.oracle.updateOracles(path);
                amount = _indexpoolFactory.oracle.consult(path);

                if (amount == 0) {
                    amount = _indexpoolFactory.uniswapRouter.getAmountsOut(allocation[i], path)[
                    path.length - 1
                    ];
                }
            }
            amounts[i] = amount;
            quotaPrice += amount;
        }
        return quotaPrice;
    }

    function buy(uint256 nQuotas, uint256[] memory amounts, address[][] memory paths) internal {
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

            _shares[tokenAddress][msg.sender] += bought;
        }
    }

    /**
     * @notice Withdraw tokens and convert them into ETH.
     *
     * @dev Withdraw basically registers how much of each token needs to be sold
     * according to the amounts that the user holds and the percentage he wants to
     * withdraw.
     *
     * @param sellPct Percentage of shares to be cashed out (1000 = 100%)
     * @param paths Execution paths
     */
    function withdraw(
        uint256 sellPct,
        address[][] memory paths
    ) external override {
        uint256 ethAmount = 0;
        address[] memory path;
        uint256[] memory result;

        require(sellPct > 0, "SELL PCT NEEDS TO BE GREATER THAN ZERO");
        require(_shares[tokens[0]][msg.sender] > 0, "NEEDS TO HAVE SHARES OF THE INDEX");
        require(sellPct <= 1000, "CAN'T SELL MORE THAN 100% OF FUNDS");

        // TODO Create sell function
        for (uint256 i = 0; i < tokens.length; i++) {
            address tokenAddress = tokens[i];
            uint256 sharesAmount = (_shares[tokenAddress][msg.sender] * sellPct) / 1000;

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
                _shares[tokenAddress][msg.sender] -= result[0];
                ethAmount += result[result.length - 1];
            } else {
                _shares[tokenAddress][msg.sender] -= sharesAmount;
                ethAmount += sharesAmount;
            }
        }
        payable(msg.sender).transfer(ethAmount);
        emit LOG_WITHDRAW(msg.sender, sellPct, ethAmount);
    }

    /**
     * @notice Uniswap wrapper to trade from ETH to tokens.
     *
     * @dev Sets path of the trade and send the order to Uniswap.
     *
     * @param ethAmount Amount in ETH
     * @param path Trade path to be executed in the DEX contract
     */
    function tradeFromETH(
        uint256 ethAmount,
        address[] memory path
    ) private returns (uint256[] memory) {
        return
        _indexpoolFactory.uniswapRouter.swapExactETHForTokens{value : ethAmount}(
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
            IERC20(fromToken).approve(address(_indexpoolFactory.uniswapRouter), sharesAmount),
            "approve failed."
        );

        return
        _indexpoolFactory.uniswapRouter.swapExactTokensForETH(
            sharesAmount,
            1, // amountOutMin
            path, // path
            address(this), // to
            block.timestamp + 100000 // deadline
        );
    }

    /**
     * @notice Cashout ERC20 tokens directly to wallet.
     *
     * @dev This is mostly a safety feature and a way for users to cashout
     * their ERC20 tokens in case one of the dependencies on this contract
     * goes amiss.
     *
     * @param userAddress Address of user to have ERC20 tokens withdrawn
     * @param sharesPct Percentage of shares to be cashed out (1000 = 100%)
     */

    function cashOutERC20Internal(
        address userAddress,
        uint256 sharesPct
    ) internal {
        address tokenAddress;
        uint256 amount;
        uint256[] memory amounts = new uint256[](tokens.length);

        for (uint256 i = 0; i < tokens.length; i++) {
            tokenAddress = tokens[i];
            amount = (_shares[tokenAddress][userAddress] * sharesPct) / 1000;

            require(_shares[tokenAddress][userAddress] >= amount, "INSUFFICIENT FUNDS");
            _shares[tokenAddress][userAddress] -= amount;

            require(amount > 0, "AMOUNT TO CASH OUT IS TOO SMALL");

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

        emit LOG_ERC20_WITHDRAW(userAddress, sharesPct, amounts);
    }

    /**
     * @notice Cash-out ERC20 tokens directly to wallet.
     *
     * @dev This is to be used whenever users want to cash out their ERC20 tokens.
     *
     * @param sharesPct Percentage of shares to be cashed out (1000 = 100%)
     */
    function cashOutERC20(uint256 sharesPct)
    external
    override
    {
        cashOutERC20Internal(msg.sender, sharesPct);
    }

    /**
     * @notice Admin-force cash-out ERC20 tokens directly to wallet.
     *
     * @dev This is a security measure, basically giving us the ability to eject users
     * from the contract in case some vulnerability is found on the withdrawal method.
     *
     * @param sharesPct Percentage of shares to be cashed out (1000 = 100%)
     */
    function cashOutERC20Admin(
        address user,
        uint256 sharesPct
    ) external override _indexpoolOnly_ {
        cashOutERC20Internal(user, sharesPct);
    }

    /**
     * @notice Mint a specific NFT token.
     *
     * @dev Mints a specific NFT token remove assigned contracts from contract and into token.
     *
     * @param sharesPct Percentage of shares to be minted as NFT (1000 = 100%)
     */
//    function mintPool721(
//        uint256 sharesPct
//    ) external override {
//        address token;
//        uint256[] memory allocationNFT = new uint256[](tokens.length);
//
//        for (uint256 i = 0; i < tokens.length; i++) {
//            token = tokens[i];
//            allocationNFT[i] = (_shares[token][msg.sender] * sharesPct) / 1000;
//            require(allocationNFT[i] > 0, "NOT ENOUGH FUNDS");
//            _shares[token][msg.sender] -= allocationNFT[i];
//        }
//
//        _pool721.generatePool721(msg.sender, allocationNFT);
//    }

    /**
     * @notice Burn a specific NFT token.
     *
     * @dev Burns a specific NFT token and assigns assets back to NFT owner.
     * Only callable by whoever holds the token.
     *
     * @param tokenId Token Id (position in `tokens` array)
     */
//    function burnPool721(uint256 tokenId) external override {
//        // TODO make burnPool work on new architecture
//        uint256 indexId;
//
//        require(
//            _pool721.ownerOf(tokenId) == msg.sender,
//            "ONLY CALLABLE BY TOKEN OWNER"
//        );
//
//        (indexId, allocationNFT) = _pool721.burnPool721(tokenId);
//
//        address token;
//
//        for (uint256 i = 0; i < tokens.length; i++) {
//            token = tokens[i];
//            _shares[token][msg.sender] += allocationNFT[i];
//        }
//    }

    /**
     * @notice Get Pool721 (NFT contract) address.
     *
     * @dev Get the address of the NFT contract minted by this Pool.
//     */
//    function getPool721Address() external view override returns (address) {
//        return address(_pool721);
//    }

    /**
     * @notice Pay creator fee.
     *
     * @dev Only callable by the creator. Cashes out ETH funds that are due to
     * a 0.1% in all deposits on the created index.
     */
    function payCreatorFee() external override {
        require(msg.sender == creator, "ONLY INDEX CREATOR CAN WITHDRAW FEES");

        uint256 creatorFee = fee / 2;
        uint256 withdrawAmount = creatorFee - creatorFeeCashOut;

        require(withdrawAmount > 0, "NO FEE TO WITHDRAW");

        creatorFeeCashOut += withdrawAmount;

        payable(msg.sender).transfer(withdrawAmount);
        emit LOG_FEE_WITHDRAW(msg.sender, withdrawAmount);
    }

    /**
     * @notice Reads available creator fee.
     *
     * @dev Check how much is owed to the creator.
     */
    function getAvailableCreatorFee()
    external
    view
    override
    returns (uint256)
    {
        uint256 creatorFee = fee / 2;
        uint256 creatorAvailableFee = creatorFee - creatorFeeCashOut;

        return creatorAvailableFee;
    }

    /**
     * @notice Pay protocol fee.
     *
     * @dev Only callable by the protocol creator. Cashes out ETH funds that are due to
     * a 0.1% in all deposits on the created index.
     */
    function payProtocolFee()
    external
    override
    _indexpoolOnly_
    {
        uint256 protocolFee = fee / 2;
        uint256 withdrawAmount = protocolFee - protocolFeeCashOut;

        require(withdrawAmount > 0, "NO FEE TO WITHDRAW");

        protocolFeeCashOut += withdrawAmount;

        payable(msg.sender).transfer(withdrawAmount);
        emit LOG_FEE_WITHDRAW(msg.sender, withdrawAmount);
    }

    /**
     * @notice Reads available protocol fee.
     *
     * @dev Check how much is owed to the protocol.
     */
    function getAvailableProtocolFee()
    external
    view
    override
    returns (uint256)
    {
        uint256 protocolFee = fee / 2;
        uint256 protocolAvailableFee = protocolFee - protocolFeeCashOut;

        return protocolAvailableFee;
    }
}
