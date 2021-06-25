pragma solidity 0.8.6;

import "../libraries/DataStructures.sol";

/**
 * @title IPool
 * @author IndexPool
 *
 * @notice Coordinates all index creation, deposits/withdrawals, and fee payments.
 *
 * @dev This interface has 3 main functions:
 *
 * 1. Create indexes
 * 2. Deposit / Withdrawals
 * 3. Control fees due to index creator and IndexPool protocol
 */

interface IPool {
/**
 * @notice Counts how many indexes have been created.
 *
 * @dev Each index is appended into the `indexes` array, so to know how
 * many indexes have been created you only need to check its lenght.
 *
 */
    function get_indexes_length() external view returns (uint256);

    /**
     * @notice Lists all index creators.
     *
     * @dev Creator address is a part of the `Index` struct. So you just need
     * to iterate across indexes and pull the creator address.
     *
     */
    // TODO evaluate if this is being used somewhere.
    function get_indexes_creators() external view returns (address[] memory);

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
    ) external view returns (uint256);

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
        returns (uint256[] memory);

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
        returns (address[] memory);

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
        returns (OutputIndex memory);

    function set_max_deposit(uint256 _max_deposit) external;

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
    ) external;

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
    function deposit(uint256 _index_id, address[][] memory paths)
        external
        payable;

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
    function withdraw(
        uint256 _index_id,
        uint256 _sell_pct,
        address[][] memory paths
    ) external;

        /**
     * @notice Cashout ERC20 tokens directly to wallet.
     *
     * @dev This is to be used whenever users want to cash out their ERC20 tokens.
     *
     * @param index_id Index Id (position in `indexes` array)
     * @param shares_pct Percentage of shares to be cashed out (1000 = 100%)
     */
    function cash_out_erc20(uint256 index_id, uint256 shares_pct) external;

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
    ) external;

    /**
     * @notice Mint a specific NFT token.
     *
     * @dev Mints a specific NFT token remove assigned contracts from contract and into token.
     */
    function mint_Pool721(uint256 index_id) external;

    /**
     * @notice Burn a specific NFT token.
     *
     * @dev Burns a specific NFT token and assigns assets back to NFT owner.
     * Only callable by whoever holds the token.
     */
    function burn_Pool721(uint256 tokenId) external;

    /**
     * @notice Get Pool721 (NFT contract) address.
     *
     * @dev Get the address of the NFT contract minted by this Pool.
     */
    function get_pool721_address() external view returns (address);

    /**
     * @notice Pay creator fee.
     *
     * @dev Only callable by the creator. Cashes out ETH funds that are due to
     * a 0.1% in all deposits on the created index.
     *
     * @param _index_id Index Id (position in `indexes` array)
     */
    function pay_creator_fee(uint256 _index_id) external;

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
        returns (uint256);

    /**
     * @notice Pay protocol fee.
     *
     * @dev Only callable by the protocol creator. Cashes out ETH funds that are due to
     * a 0.1% in all deposits on the created index.
     *
     * @param _index_id Index Id (position in `indexes` array)
     */
    function pay_protocol_fee(uint256 _index_id) external;

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
        returns (uint256);
}
