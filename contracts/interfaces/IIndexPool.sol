pragma solidity >=0.8.6;

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

interface IIndexPool {
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
    payable;

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
    ) external;

    /**
     * @notice Cash-out ERC20 tokens directly to wallet.
     *
     * @dev This is to be used whenever users want to cash out their ERC20 tokens.
     *
     * @param sharesPct Percentage of shares to be cashed out (1000 = 100%)
     */
    function cashOutERC20(uint256 sharesPct)
    external;

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
    ) external;

    /**
     * @notice Mint a specific NFT token.
     *
     * @dev Mints a specific NFT token remove assigned contracts from contract and into token.
     *
     * @param sharesPct Percentage of shares to be minted as NFT (1000 = 100%)
     */
//    function mintPool721(
//        uint256 sharesPct
//    ) external;

    /**
     * @notice Burn a specific NFT token.
     *
     * @dev Burns a specific NFT token and assigns assets back to NFT owner.
     * Only callable by whoever holds the token.
     *
     * @param tokenId Token Id (position in `tokens` array)
     */
//    function burnPool721(uint256 tokenId) external;

    /**
     * @notice Get Pool721 (NFT contract) address.
     *
     * @dev Get the address of the NFT contract minted by this Pool.
     */
//    function getPool721Address() external view returns (address);

    /**
     * @notice Pay creator fee.
     *
     * @dev Only callable by the creator. Cashes out ETH funds that are due to
     * a 0.1% in all deposits on the created index.
     */
    function payCreatorFee() external;

    /**
     * @notice Reads available creator fee.
     *
     * @dev Check how much is owed to the creator.
     */
    function getAvailableCreatorFee()
    external
    view
    returns (uint256);

    /**
     * @notice Pay protocol fee.
     *
     * @dev Only callable by the protocol creator. Cashes out ETH funds that are due to
     * a 0.1% in all deposits on the created index.
     */
    function payProtocolFee()
    external;

    /**
     * @notice Reads available protocol fee.
     *
     * @dev Check how much is owed to the protocol.
     */
    function getAvailableProtocolFee()
    external
    view
    returns (uint256);
}
