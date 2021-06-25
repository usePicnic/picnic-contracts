pragma solidity >=0.8.6;

import "hardhat/console.sol";
import "./interfaces/IPool.sol";
import "./libraries/DataStructures.sol";
import "./Pool721.sol";
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
    Index[] private indexes;
    IOraclePath oracle;

    IUniswapV2Router02 uniswap_router;
    address creator;

    uint256 constant BASE_ASSET = 1000000000000000000;
    uint256 max_deposit = 100 * BASE_ASSET;

    Pool721 pool721;

    constructor(address _uniswap_factory, address oracleAddress) {
        uniswap_router = IUniswapV2Router02(_uniswap_factory);
        creator = msg.sender;
        pool721 = new Pool721();
        oracle = IOraclePath(oracleAddress);
    }

    modifier _indexpool_only_() {
        require(msg.sender == creator, "ONLY INDEXPOOL CAN CALL THIS FUNCTION");
        _;
    }

    event LOG_CREATE_INDEX(
        uint256 indexed index_id,
        address indexed creator,
        address[] tokens,
        uint256[] allocation
    );

    event LOG_DEPOSIT(
        address indexed user_id,
        uint256 indexed index_id,
        uint256 amount_in
    );

    event LOG_WITHDRAW(
        address indexed user_id,
        uint256 indexed index_id,
        uint256 percentage,
        uint256 amount_out
    );

    event LOG_ERC20_WITHDRAW(
        address indexed user_id,
        uint256 indexed index_id,
        uint256 percentage,
        uint256[] amounts
    );

    event LOG_FEE_WITHDRAW(
        address indexed user_id,
        uint256 indexed index_id,
        uint256 amount_out
    );

    event Received(address sender, uint256 amount);

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    /**
     * @notice Counts how many indexes have been created.
     *
     * @dev Each index is appended into the `indexes` array, so to know how
     * many indexes have been created you only need to check its lenght.
     *
     */
    function get_indexes_length() external view override returns (uint256) {
        return indexes.length;
    }

    /**
     * @notice Lists all index creators.
     *
     * @dev Creator address is a part of the `Index` struct. So you just need
     * to iterate across indexes and pull the creator address.
     *
     */
    // TODO evaluate if this is being used somewhere.
    function get_indexes_creators()
        external
        view
        override
        returns (address[] memory)
    {
        address[] memory addresses = new address[](indexes.length);

        for (uint256 i = 0; i < indexes.length; i++) {
            addresses[i] = indexes[i].creator;
        }

        return addresses;
    }

    /**
     * @notice List a user balance for a specific token in an specific index.
     *
     * @dev Access the mapping that control holdings for index -> token -> user.
     *
     * @param index_id Index Id (position in `indexes` array)
     * @param token Token address
     * @param user_id User address
     */
    function get_token_balance(
        uint256 index_id,
        address token,
        address user_id
    ) external view override returns (uint256) {
        return indexes[index_id].shares[token][user_id];
    }

    /**
     * @notice List allocation for tokens.
     *
     * @dev Simply access the `allocation` array in the Index struct, note that
     * order is the same as the `tokens` array.
     *
     * @param index_id Index Id (position in `indexes` array)
     */
    function get_index_allocation(uint256 index_id)
        external
        view
        override
        returns (uint256[] memory)
    {
        return indexes[index_id].allocation;
    }

    /**
     * @notice List token addresses.
     *
     * @dev Simply access the `tokens` array in the Index struct.
     *
     * @param index_id Index Id (position in `indexes` array)
     */
    function get_index_tokens(uint256 index_id)
        external
        view
        override
        returns (address[] memory)
    {
        return indexes[index_id].tokens;
    }

    /**
     * @notice List allocation for tokens.
     *
     * @dev Uses a struct type called `OutputIndex` which is `Index` withouts
     * the mappings.
     *
     * @param index_id Index Id (position in `indexes` array)
     */
    function get_index(uint256 index_id)
        external
        view
        override
        returns (OutputIndex memory)
    {
        OutputIndex memory output = OutputIndex({
            creator: indexes[index_id].creator,
            allocation: indexes[index_id].allocation,
            tokens: indexes[index_id].tokens,
            fee: indexes[index_id].fee,
            creator_fee_cash_out: indexes[index_id].creator_fee_cash_out,
            protocol_fee_cash_out: indexes[index_id].protocol_fee_cash_out
        });

        return output;
    }

    /**
     * @notice Set max deposit (guarded launch).
     *
     * @dev Created to minimize damage in case any vulnerability is found on the
     * contract.
     *
     * @param _max_deposit Max deposit value in wei
     */
    function set_max_deposit(uint256 _max_deposit)
        external
        override
        _indexpool_only_
    {
        max_deposit = _max_deposit;
    }

    /**
     * @notice Creates a new index.
     *
     * @dev Create a new `Index` struct and append it to `indexes`.

     * Token addresses and allocations are set at this moment and will be 
     * immutable for the rest of the contract's life.
     *
     * @param _allocation Array of allocations (ordered by token addresses)
     * @param _tokens Array of token addresses
     * @param paths Paths to be used respective to each token on DEX
     */
    // TODO switch order (tokens should be first)
    function create_index(
        uint256[] memory _allocation,
        address[] memory _tokens,
        address[][] memory paths
    ) external override {
        require(
            _allocation.length == _tokens.length,
            "MISMATCH IN LENGTH BETWEEN TOKENS AND ALLOCATION"
        );

        require(
            _tokens.length <= 32,
            "NO MORE THAN 32 TOKENS ALLOWED IN A SINGLE INDEX"
        );

        require(check_not_duplicates(_tokens), "DUPLICATED TOKENS"); // import security feature

        address[] memory path = new address[](2);
        address token;
        uint256 amount;

        // Allocation size
        for (uint8 i = 0; i < _allocation.length; i++) {
            path = paths[i];
            token = _tokens[i];

            if (address(0) != token) {
                require(
                    token == path[0],
                    "WRONG PATH: TOKEN NEEDS TO BE PART OF PATH"
                );

                // checks if not network asset
                amount = uniswap_router.getAmountsOut(_allocation[i], path)[1];
                require(
                    amount > 100000,
                    "ALLOCATION AMOUNT IS TOO SMALL, NEEDS TO BE AT LEAST EQUIVALENT TO 100,000 WEI"
                );

                oracle.updateOracles(path);
            }
        }

        Index storage index = indexes.push();
        index.allocation = _allocation;
        index.creator = msg.sender;
        index.tokens = _tokens;

        emit LOG_CREATE_INDEX(
            indexes.length - 1,
            creator,
            _tokens,
            _allocation
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
    function check_not_duplicates(address[] memory tokens)
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
     * @param _index_id Index Id (position in `indexes` array)
     * @param paths Paths to be used respective to each token on DEX
     */
    function deposit(uint256 _index_id, address[][] memory paths)
        external
        payable
        override
    {
        require(
            msg.value <= max_deposit,
            "EXCEEDED MAXIMUM ALLOWED DEPOSIT VALUE"
        );

        require(
            msg.value > BASE_ASSET / 1000,
            "MINIMUM DEPOSIT OF 0.001 MATIC"
        );

        address[] memory tokens = indexes[_index_id].tokens;
        uint256[] memory allocation = indexes[_index_id].allocation;
        uint256[] memory amounts = new uint256[](tokens.length);
        uint256 amount;
        address[] memory path;
        uint256[] memory result;

        // Pay fees
        uint256 fee = msg.value / 500;
        indexes[_index_id].fee += fee;

        uint256 free_amount = msg.value - fee; // Prepare for deposit fee

        // Allocation size
        uint256 quota_price = 0;
        for (uint8 i = 0; i < allocation.length; i++) {
            path = paths[i];

            require(
                tokens[i] == path[path.length - 1],
                "WRONG PATH: TOKEN NEEDS TO BE PART OF PATH"
            );

            if (address(0) == tokens[i]) {
                amount = allocation[i];
            } else {
                oracle.updateOracles(path);
                amount = oracle.consult(path);

                if (amount == 0) {
                    amount = uniswap_router.getAmountsOut(allocation[i], path)[
                        path.length - 1
                    ];
                }
            }
            amounts[i] = amount;
            quota_price += amount;
        }

        uint256 n_quotas = free_amount / quota_price;

        uint256 bought;
        // TODO how to remove storage from here
        Index storage index = indexes[_index_id];

        // Register operations
        for (uint8 i = 0; i < tokens.length; i++) {
            address _token = tokens[i];
            uint256 _amount = amounts[i] * n_quotas;
            path = paths[i];

            if (address(0) != tokens[i]) {
                result = trade_from_eth({
                    to_token: _token,
                    eth_amount: _amount,
                    path: path
                });
                bought = result[result.length - 1];
            } else {
                bought = _amount;
            }

            index.shares[_token][msg.sender] += bought;
        }

        emit LOG_DEPOSIT(msg.sender, _index_id, msg.value);
    }

    /**
     * @notice Withdraw tokens and convert them into ETH.
     *
     * @dev Withdraw basically registers how much of each token needs to be sold
     * according to the amounts that the user holds and the percentage he wants to
     * withdraw.
     *
     * @param _index_id Index Id (position in `indexes` array)
     * @param _sell_pct Percentage of shares to be cashed out (1000 = 100%)
     * @param paths Execution paths
     */
    function withdraw(
        uint256 _index_id,
        uint256 _sell_pct,
        address[][] memory paths
    ) external override {
        uint256 eth_amount = 0;
        address[] memory path;
        address[] memory tokens = indexes[_index_id].tokens;
        uint256[] memory result;

        require(_sell_pct > 0, "SELL PCT NEEDS TO BE GREATER THAN ZERO");
        require(
            indexes[_index_id].shares[tokens[0]][msg.sender] > 0,
            "NEEDS TO HAVE SHARES OF THE INDEX"
        );
        require(_sell_pct <= 1000, "CAN'T SELL MORE THAN 100% OF FUNDS");

        indexes[_index_id].pending_tx_counter[msg.sender] += indexes[_index_id]
        .tokens
        .length;

        for (uint256 i = 0; i < tokens.length; i++) {
            address _token = tokens[i];
            uint256 shares_amount = (indexes[_index_id].shares[_token][
                msg.sender
            ] * _sell_pct) / 1000;

            path = paths[i];

            if (address(0) != tokens[i]) {
                require(
                    tokens[i] == path[0],
                    "WRONG PATH: TOKEN NEEDS TO BE PART OF PATH"
                );

                result = trade_from_tokens({
                    from_token: _token,
                    shares_amount: shares_amount,
                    path: path
                });
                indexes[_index_id].shares[_token][msg.sender] -= result[0];
                eth_amount += result[result.length - 1];
            } else {
                indexes[_index_id].shares[_token][msg.sender] -= shares_amount;
                eth_amount += shares_amount;
            }
        }
        payable(msg.sender).transfer(eth_amount);
        emit LOG_WITHDRAW(msg.sender, _index_id, _sell_pct, eth_amount);
    }

    /**
     * @notice Uniswap wrapper to trade from ETH to tokens.
     *
     * @dev Sets path of the trade and send the order to Uniswap.
     *
     * @param to_token Address of token to be traded
     * @param eth_amount Amount in ETH
     */
    // TODO set optimal Uniswap path
    function trade_from_eth(
        address to_token,
        uint256 eth_amount,
        address[] memory path
    ) private returns (uint256[] memory) {
        return
            uniswap_router.swapExactETHForTokens{value: eth_amount}(
                1, // amountOutMin TODO use oracle
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
     * @param from_token Address of token to be traded
     * @param shares_amount Amount in token
     */
    // TODO set optimal Uniswap path
    function trade_from_tokens(
        address from_token,
        uint256 shares_amount,
        address[] memory path
    ) private returns (uint256[] memory) {
        require(
            IERC20(from_token).approve(address(uniswap_router), shares_amount),
            "approve failed."
        );

        return
            uniswap_router.swapExactTokensForETH(
                shares_amount,
                1, // amountOutMin TODO use oracle
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
     * @param user Address of user to have ERC20 tokens withdrawn
     * @param index_id Index Id (position in `indexes` array)
     * @param shares_pct Percentage of shares to be cashed out (1000 = 100%)
     */

    function cash_out_erc20_internal(
        address user,
        uint256 index_id,
        uint256 shares_pct
    ) internal {
        uint256 amount;
        uint256[] memory amounts;
        address token;

        for (uint256 i = 0; i < indexes[index_id].tokens.length; i++) {
            token = indexes[index_id].tokens[i];
            amount = ((indexes[index_id].shares[token][user] * shares_pct) /
                1000);

            require(
                indexes[index_id].shares[token][user] >= amount,
                "INSUFFICIENT FUNDS"
            );
            indexes[index_id].shares[token][user] -= amount;

            require(amount > 0, "AMOUNT TO CASH OUT IS TOO SMALL");

            if (address(0) != token) {
                require(
                    IERC20(token).approve(address(user), amount),
                    "ERC20 APPROVE FAILED"
                );
                IERC20(token).transfer(user, amount);
                // TODO figure out how to collect this data
                // amounts[i] = amount;
            } else {
                payable(user).transfer(amount);
            }
        }

        emit LOG_ERC20_WITHDRAW(user, index_id, shares_pct, amounts);
    }

    /**
     * @notice Cashout ERC20 tokens directly to wallet.
     *
     * @dev This is to be used whenever users want to cash out their ERC20 tokens.
     *
     * @param index_id Index Id (position in `indexes` array)
     * @param shares_pct Percentage of shares to be cashed out (1000 = 100%)
     */
    function cash_out_erc20(uint256 index_id, uint256 shares_pct)
        external
        override
    {
        cash_out_erc20_internal(msg.sender, index_id, shares_pct);
    }

    /**
     * @notice Admin-force cashout ERC20 tokens directly to wallet.
     *
     * @dev This is a security measure, basically giving us the ability to eject users
     * from the contract in case some vulnerability is found on the withdrawal method.
     *
     * @param index_id Index Id (position in `indexes` array)
     * @param shares_pct Percentage of shares to be cashed out (1000 = 100%)
     */
    function cash_out_erc20_admin(
        address user,
        uint256 index_id,
        uint256 shares_pct
    ) external override _indexpool_only_ {
        cash_out_erc20_internal(user, index_id, shares_pct);
    }

    /**
     * @notice Mint a specific NFT token.
     *
     * @dev Mints a specific NFT token remove assigned contracts from contract and into token.
     */
    function mint_Pool721(
        uint256 index_id // TODO add shares pct?
    ) external override {
        address token;
        address[] memory tokens = indexes[index_id].tokens;
        uint256[] memory allocation = new uint256[](tokens.length);

        for (uint256 i = 0; i < tokens.length; i++) {
            token = tokens[i];
            allocation[i] = indexes[index_id].shares[token][msg.sender];
            require(allocation[i] > 0, "NOT ENOUGH FUNDS");
            indexes[index_id].shares[token][msg.sender] = 0;
        }

        pool721.generatePool721(msg.sender, index_id, allocation);
    }

    /**
     * @notice Burn a specific NFT token.
     *
     * @dev Burns a specific NFT token and assigns assets back to NFT owner.
     * Only callable by whoever holds the token.
     */
    function burn_Pool721(uint256 tokenId) external override {
        uint256 index_id;
        uint256[] memory allocation;

        require(
            pool721.ownerOf(tokenId) == msg.sender,
            "ONLY CALLABLE BY TOKEN OWNER"
        );

        (index_id, allocation) = pool721.burnPool721(tokenId);

        address[] memory tokens = indexes[index_id].tokens;
        address token;

        for (uint256 i = 0; i < tokens.length; i++) {
            token = tokens[i];
            indexes[index_id].shares[token][msg.sender] += allocation[i];
        }
    }

    /**
     * @notice Get Pool721 (NFT contract) address.
     *
     * @dev Get the address of the NFT contract minted by this Pool.
     */
    function get_pool721_address() external view override returns (address) {
        return address(pool721);
    }

    /**
     * @notice Pay creator fee.
     *
     * @dev Only callable by the creator. Cashes out ETH funds that are due to
     * a 0.1% in all deposits on the created index.
     *
     * @param _index_id Index Id (position in `indexes` array)
     */
    function pay_creator_fee(uint256 _index_id) external override {
        require(
            msg.sender == indexes[_index_id].creator,
            "ONLY INDEX CREATOR CAN WITHDRAW FEES"
        );

        uint256 creator_fee = indexes[_index_id].fee / 2;
        uint256 withdraw_amount = creator_fee -
            indexes[_index_id].creator_fee_cash_out;

        require(withdraw_amount > 0, "NO FEE TO WITHDRAW");

        indexes[_index_id].creator_fee_cash_out += withdraw_amount;

        payable(msg.sender).transfer(withdraw_amount);
        emit LOG_FEE_WITHDRAW(msg.sender, _index_id, withdraw_amount);
    }

    /**
     * @notice Reads available creator fee.
     *
     * @dev Check how much is owed to the creator.
     *
     * @param _index_id Index Id (position in `indexes` array)
     */
    function get_available_creator_fee(uint256 _index_id)
        external
        view
        override
        returns (uint256)
    {
        uint256 creator_fee = indexes[_index_id].fee / 2;
        uint256 creator_available_fee = creator_fee -
            indexes[_index_id].creator_fee_cash_out;

        return creator_available_fee;
    }

    /**
     * @notice Pay protocol fee.
     *
     * @dev Only callable by the protocol creator. Cashes out ETH funds that are due to
     * a 0.1% in all deposits on the created index.
     *
     * @param _index_id Index Id (position in `indexes` array)
     */
    function pay_protocol_fee(uint256 _index_id)
        external
        override
        _indexpool_only_
    {
        uint256 protocol_fee = indexes[_index_id].fee / 2;
        uint256 withdraw_amount = protocol_fee -
            indexes[_index_id].protocol_fee_cash_out;

        require(withdraw_amount > 0, "NO FEE TO WITHDRAW");

        indexes[_index_id].protocol_fee_cash_out += withdraw_amount;

        payable(msg.sender).transfer(withdraw_amount);
        emit LOG_FEE_WITHDRAW(msg.sender, _index_id, withdraw_amount);
    }

    /**
     * @notice Reads available protocol fee.
     *
     * @dev Check how much is owed to the protocol.
     *
     * @param _index_id Index Id (position in `indexes` array)
     */
    function get_available_protocol_fee(uint256 _index_id)
        external
        view
        override
        returns (uint256)
    {
        uint256 protocol_fee = indexes[_index_id].fee / 2;
        uint256 protocol_available_fee = protocol_fee -
            indexes[_index_id].protocol_fee_cash_out;

        return protocol_available_fee;
    }
}
