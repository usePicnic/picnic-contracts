pragma solidity 0.8.4;

import "hardhat/console.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IERC20.sol";

/**
 * @title Pool
 * @author IndexPool
 *
 * @notice Coordinates all index creation, deposits/withdrawals, and fee payments.
 *
 * @dev This contract has 4 main functions:
 *
 * 1. Create indexes
 * 2. Deposit / Withdrawals
 * 3. Swap tokens for buy / sell
 * 4. Control fees due to index creator and IndexPool protocol
 */

contract Pool {
    struct Index {
        address creator;
        uint256[] allocation;
        address[] tokens;
        uint256 fee;
        uint256 creator_fee_cash_out;
        uint256 protocol_fee_cash_out;
        mapping(address => mapping(address => uint256)) shares; // Token address -> user address -> shares
        mapping(address => uint256) amount_to_withdraw; // user address -> ETH balance
        mapping(address => uint256) pending_tx_counter; // user address -> # of pending transactions
    }

    struct OutputIndex {
        address creator;
        uint256[] allocation;
        address[] tokens;
        uint256 fee;
        uint256 creator_fee_cash_out;
        uint256 protocol_fee_cash_out;
    }

    struct TxReceipt {
        uint256 index_id;
        address user_id;
        uint256 amount;
    }

    Index[] private indexes;

    mapping(address => TxReceipt[]) buy_txs_eth; // Token -> List of Buy Txs
    mapping(address => uint256) buy_intent_eth; // Token -> Total Buy intent in ETH

    mapping(address => TxReceipt[]) sell_txs_shares; // Token -> List of Sell Txs
    mapping(address => uint256) sell_intent_shares; // Token -> Total Sell intent in Shares

    IUniswapV2Router02 uniswap_router;
    address creator;

    uint256 constant BASE_ASSET = 1000000000000000000;

    constructor(address _uniswap_factory) public {
        uniswap_router = IUniswapV2Router02(_uniswap_factory);
        creator = msg.sender;
    }

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
    function get_indexes_length() public view returns (uint256) {
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
    function get_indexes_creators() public view returns (address[] memory) {
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
    ) public view returns (uint256) {
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
        public
        view
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
        public
        view
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
        public
        view
        returns (OutputIndex memory)
    {
        OutputIndex memory output =
            OutputIndex({
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
     * @notice Creates a new index.
     *
     * @dev Create a new `Index` struct and append it to `indexes`.

     * Token addresses and allocations are set at this moment and will be 
     * immutable for the rest of the contract's life.
     *
     * @param _allocation Array of allocations (ordered by token addresses)
     * @param _tokens Array of token addresses
     */
    // TODO switch order (tokens should be first)
    function create_index(
        uint256[] memory _allocation,
        address[] memory _tokens
    ) public {
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
        path[1] = uniswap_router.WETH();

        uint256 amount;

        // Allocation size
        for (uint8 i = 0; i < _allocation.length; i++) {
            path[0] = _tokens[i];
            amount = uniswap_router.getAmountsOut(_allocation[i], path)[1];
            require(
                amount > 100000,
                "ALLOCATION AMOUNT IS TOO SMALL, NEEDS TO BE AT LEAST EQUIVALENT TO 100,000 WEI"
            );
        }
        
        // Workaround to solve for struct with nested mappings       
        Index storage index = indexes.push();
        index.allocation = _allocation;
        index.creator = msg.sender;
        index.tokens = _tokens;
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
     */
    function deposit(uint256 _index_id) public payable {
        address[] memory tokens = indexes[_index_id].tokens;
        uint256[] memory allocation = indexes[_index_id].allocation;
        uint256[] memory amounts = new uint256[](tokens.length);
        uint256 amount;

        address[] memory path = new address[](2);
        path[1] = uniswap_router.WETH();

        // Pay fees
        uint256 fee = msg.value / 500;
        indexes[_index_id].fee += fee;

        uint256 free_amount = msg.value - fee; // Prepare for deposit fee

        // Allocation size
        uint256 quota_price = 0;
        for (uint8 i = 0; i < allocation.length; i++) {
            path[0] = tokens[i];
            amount = uniswap_router.getAmountsOut(allocation[i], path)[1];
            amounts[i] = amount;
            quota_price += amount;
        }

        uint256 n_quotas = free_amount / quota_price;

        // Register operations
        for (uint8 i = 0; i < tokens.length; i++) {
            address _token = tokens[i];
            uint256 _amount = amounts[i] * n_quotas;

            require(
                buy_txs_eth[_token].length < 200,
                "NO MORE THAN 200 PENDING TRANSACTIONS ALLOWED FOR A GIVEN ASSET"
            );

            // Register total buy intent for specific token
            buy_intent_eth[_token] += _amount;

            // Create transaction receipt so it can be backtracked to original buyer
            TxReceipt memory tx_receipt =
                TxReceipt({
                    index_id: _index_id,
                    user_id: msg.sender,
                    amount: _amount
                });

            buy_txs_eth[_token].push(tx_receipt);
        }
    }

    /**
     * @notice Execute swaps for pending deposits.
     *
     * @dev This is the function that executes swaps for all deposits
     * for all tokens on this index.
     *
     * User that calls this function receives 0.05% fee to compensate
     * for gas costs.
     *
     * @param index_id Index Id (position in `indexes` array)
     */
    function buy(uint256 index_id) public {
        uint256 deposit_fee;
        uint256 total_deposit_fee;

        for (uint256 i = 0; i < indexes[index_id].tokens.length; i++) {
            address token = indexes[index_id].tokens[i];
            deposit_fee = buy_intent_eth[token] / 1995;
            total_deposit_fee += deposit_fee;

            // Trade
            uint256[] memory result =
                trade_from_eth({
                    to_token: token,
                    eth_amount: buy_intent_eth[token]
                });

            // Process trade results back to individual accounts
            attribute_buy_order_to_users({
                token: token,
                shares_traded: result[result.length - 1],
                traded_amount: result[0]
            });
        }

        payable(msg.sender).transfer(total_deposit_fee);
    }

    /**
     * @notice Execute pending buy swaps for an individual token.
     *
     * @dev This is the function that a single swap on an Uniswap V2 contract.
     *
     * User that calls this function receives 0.05% fee to compensate
     * for gas costs.
     *
     * @param token Token address
     */
    function buy_token(address token) public {
        uint256 deposit_fee;

        deposit_fee = buy_intent_eth[token] / 1995;
        // Trade
        uint256[] memory result =
            trade_from_eth({
                to_token: token,
                eth_amount: buy_intent_eth[token]
            });

        // Process trade results back to individual accounts
        attribute_buy_order_to_users({
            token: token,
            shares_traded: result[result.length - 1],
            traded_amount: result[0]
        });

        payable(msg.sender).transfer(deposit_fee);
    }

    /**
     * @notice This function settles pending deposits.
     *
     * @dev It attributes to a specific user its share of the swap for a token.
     *
     * @param token Token address
     * @param shares_traded Allocation traded
     * @param traded_amount ETH traded
     */
    function attribute_buy_order_to_users(
        address token,
        uint256 shares_traded,
        uint256 traded_amount
    ) private {
        // Allocate trade back to index holders

        for (uint256 i = 0; i < buy_txs_eth[token].length; i++) {
            // Make necessary calculations derived from the trade results and current holding state
            TxReceipt memory _tx = buy_txs_eth[token][i];

            uint256 user_share = (1000000 * _tx.amount) / traded_amount;

            uint256 bought_shares = (shares_traded * user_share) / 1000000;

            // Allocate trade back to index holders
            indexes[_tx.index_id].shares[token][_tx.user_id] += bought_shares;
        }

        delete buy_txs_eth[token];

        // Adjust pending buy amount accordingly to trade amount
        buy_intent_eth[token] -= traded_amount;
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
     */
    function withdraw(uint256 _index_id, uint256 _sell_pct) public {
        require(_sell_pct > 0, "SELL PCT NEEDS TO BE GREATER THAN ZERO");
        require(
            indexes[_index_id].shares[indexes[_index_id].tokens[0]][
                msg.sender
            ] > 0,
            "NEEDS TO HAVE SHARES OF THE INDEX"
        );

        require(_sell_pct <= 1000, "CAN'T SELL MORE THAN 100% OF FUNDS");

        indexes[_index_id].pending_tx_counter[msg.sender] += indexes[_index_id]
            .tokens
            .length;

        for (uint256 i = 0; i < indexes[_index_id].tokens.length; i++) {
            address _token = indexes[_index_id].tokens[i];
            uint256 shares_amount =
                (indexes[_index_id].shares[_token][msg.sender] * _sell_pct) /
                    1000;

            // Shift shares from user to sell intent
            sell_intent_shares[_token] += shares_amount;
            indexes[_index_id].shares[_token][msg.sender] -= shares_amount;

            // Create transaction receipt so it can be backtracked to original buyer
            TxReceipt memory tx_receipt =
                TxReceipt({
                    index_id: _index_id,
                    user_id: msg.sender,
                    amount: shares_amount
                });
            sell_txs_shares[_token].push(tx_receipt);
        }
    }

    /**
     * @notice Execute swaps for pending withdrawals.
     *
     * @dev This is the function that executes swaps for all withdrawals
     * for all tokens on this index.
     *
     * User that calls this function receives 0.05% fee to compensate
     * for gas costs.
     *
     * @param index_id Index Id (position in `indexes` array)
     */
    function sell(uint256 index_id) public {
        uint256 withdraw_fee;
        uint256 total_withdraw_fee;

        for (uint256 i = 0; i < indexes[index_id].tokens.length; i++) {
            address token = indexes[index_id].tokens[i];
            uint256[] memory result =
                trade_from_tokens({
                    from_token: token,
                    shares_amount: sell_intent_shares[token]
                });

            withdraw_fee = result[result.length - 1] / 2000;
            total_withdraw_fee += withdraw_fee;

            // Process trade results back to individual accounts
            attribute_sell_order_to_users({
                token: token,
                shares_traded: result[0],
                traded_amount: (result[result.length - 1] - withdraw_fee)
            });
        }

        payable(msg.sender).transfer(total_withdraw_fee);
    }

    /**
     * @notice Execute pending sell swaps for an individual token.
     *
     * @dev This is the function that a single swap on an Uniswap V2 contract.
     *
     * User that calls this function receives 0.05% fee to compensate
     * for gas costs.
     *
     * @param token Token address
     */
    function sell_token(address token) public {
        uint256 withdraw_fee;

        uint256[] memory result =
            trade_from_tokens({
                from_token: token,
                shares_amount: sell_intent_shares[token]
            });

        withdraw_fee = result[result.length - 1] / 2000;

        // Process trade results back to individual accounts
        attribute_sell_order_to_users({
            token: token,
            shares_traded: result[0],
            traded_amount: result[result.length - 1] - withdraw_fee
        });

        payable(msg.sender).transfer(withdraw_fee);
    }

    /**
     * @notice This function settles pending withdrawals.
     *
     * @dev It attributes to a specific user its share of the swap for a token.
     *
     * @param token Token address
     * @param shares_traded Allocation traded
     * @param traded_amount ETH traded
     */
    function attribute_sell_order_to_users(
        address token,
        uint256 shares_traded,
        uint256 traded_amount
    ) private {
        for (uint256 i = 0; i < sell_txs_shares[token].length; i++) {
            // Make necessary calculations derived from the trade results and current holding state
            TxReceipt memory _tx = sell_txs_shares[token][i];

            uint256 user_share = (1000000 * _tx.amount) / shares_traded;
            uint256 sold_amount = (traded_amount * user_share) / 1000000;

            // Allocate trade back to index holders
            indexes[_tx.index_id].amount_to_withdraw[
                _tx.user_id
            ] += sold_amount;

            // Check if all pending transactions are finished already
            indexes[_tx.index_id].pending_tx_counter[_tx.user_id] -= 1;

            if (indexes[_tx.index_id].pending_tx_counter[_tx.user_id] == 0) {
                finalize_sell(_tx.index_id, _tx.user_id);
            }
        }

        delete sell_txs_shares[token];

        sell_intent_shares[token] -= shares_traded;
    }

    /**
     * @notice Transfer ETH back to the user when all sell swaps are finished.
     *
     * @dev Once all swaps are finalized it removes the amount from the user ledger
     * and send the equivalent amount in ETH.
     *
     * @param index_id Index Id (position in `indexes` array)
     * @param user_id User address
     */
    function finalize_sell(uint256 index_id, address user_id) private {
        uint256 amount = indexes[index_id].amount_to_withdraw[user_id];
        indexes[index_id].amount_to_withdraw[user_id] -= amount;
        payable(user_id).transfer(amount);
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
    function trade_from_eth(address to_token, uint256 eth_amount)
        private
        returns (uint256[] memory)
    {
        address[] memory path = new address[](2);
        path[0] = uniswap_router.WETH();
        path[1] = to_token;

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
    function trade_from_tokens(address from_token, uint256 shares_amount)
        private
        returns (uint256[] memory)
    {
        address[] memory path = new address[](2);
        path[0] = from_token;
        path[1] = uniswap_router.WETH();

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
     * @param index_id Index Id (position in `indexes` array)
     * @param shares_pct Percentage of shares to be cashed out (1000 = 100%)
     */
    // TODO set optimal Uniswap path
    function cash_out_erc20(uint256 index_id, uint256 shares_pct) public {
        uint256 amount;
        address token;
        for (uint256 i = 0; i < indexes[index_id].tokens.length; i++) {
            token = indexes[index_id].tokens[i];
            amount =
                (indexes[index_id].shares[token][msg.sender] / 1000) *
                shares_pct;

            require(
                indexes[index_id].shares[token][msg.sender] >= amount,
                "INSUFFICIENT FUNDS"
            );
            indexes[index_id].shares[token][msg.sender] -= amount;

            require(
                IERC20(token).approve(address(msg.sender), amount),
                "ERC20 APPROVE FAILED"
            );
            IERC20(token).transfer(msg.sender, amount);
        }
    }

    /**
     * @notice Pay creator fee.
     *
     * @dev Only callable by the creator. Cashes out ETH funds that are due to
     * a 0.1% in all deposits on the created index.
     *
     * @param _index_id Index Id (position in `indexes` array)
     * @param cash_out_pct Percentage of shares to be cashed out (1000 = 100%)
     */
    function pay_creator_fee(uint256 _index_id, uint256 cash_out_pct) public {
        require(
            msg.sender == indexes[_index_id].creator,
            "ONLY INDEX CREATOR CAN WITHDRAW FEES"
        );
        require(
            cash_out_pct > 0,
            "WITHDRAW PERCANTAGE NEEDS TO BE GREATER THAN 0"
        );

        uint256 creator_fee = indexes[_index_id].fee / 2;
        uint256 creator_available_fee =
            creator_fee - indexes[_index_id].creator_fee_cash_out;
        uint256 withdraw_amount = (creator_available_fee * cash_out_pct) / 1000;

        require(
            creator_available_fee >= withdraw_amount,
            "FEE WITHDRAW LIMIT EXCEEDED"
        );

        indexes[_index_id].creator_fee_cash_out += withdraw_amount;

        payable(msg.sender).transfer(withdraw_amount);
    }

    /**
     * @notice Reads available creator fee.
     *
     * @dev Check how much is owed to the creator.
     *
     * @param _index_id Index Id (position in `indexes` array)
     */
    function get_available_creator_fee(uint256 _index_id)
        public
        view
        returns (uint256)
    {
        uint256 creator_fee = indexes[_index_id].fee / 2;
        uint256 creator_available_fee =
            creator_fee - indexes[_index_id].creator_fee_cash_out;

        return creator_available_fee;
    }

    /**
     * @notice Pay protocol fee.
     *
     * @dev Only callable by the protocol creator. Cashes out ETH funds that are due to
     * a 0.1% in all deposits on the created index.
     *
     * @param _index_id Index Id (position in `indexes` array)
     * @param cash_out_pct Percentage of shares to be cashed out (1000 = 100%)
     */
    function pay_protocol_fee(uint256 _index_id, uint256 cash_out_pct) public {
        require(msg.sender == creator, "ONLY INDEXPOOL CAN WITHDRAW FEES");
        require(
            cash_out_pct > 0,
            "WITHDRAW PERCANTAGE NEEDS TO BE GREATER THAN 0"
        );

        uint256 protocol_fee = indexes[_index_id].fee / 2;
        uint256 protocol_available_fee =
            protocol_fee - indexes[_index_id].protocol_fee_cash_out;
        uint256 withdraw_amount =
            (protocol_available_fee * cash_out_pct) / 1000;

        require(
            protocol_available_fee >= withdraw_amount,
            "FEE WITHDRAW LIMIT EXCEEDED"
        );
        indexes[_index_id].protocol_fee_cash_out += withdraw_amount;

        payable(msg.sender).transfer(withdraw_amount);
    }

    /**
     * @notice Reads available protocol fee.
     *
     * @dev Check how much is owed to the protocol.
     *
     * @param _index_id Index Id (position in `indexes` array)
     */
    function get_available_protocol_fee(uint256 _index_id)
        public
        view
        returns (uint256)
    {
        uint256 protocol_fee = indexes[_index_id].fee / 2;
        uint256 protocol_available_fee =
            protocol_fee - indexes[_index_id].protocol_fee_cash_out;

        return protocol_available_fee;
    }
}
