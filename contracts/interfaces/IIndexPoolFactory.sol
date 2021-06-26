pragma solidity >=0.8.6;

interface IIndexpoolFactory {
    function createIndex(
        address[] memory tokens,
        uint256[] memory allocation,
        address[][] memory paths
    ) external;

    /**
   * @notice Set max deposit (guarded launch).
   *
   * @dev Created to minimize damage in case any vulnerability is found on the
   * contract.
   *
   * @param newMaxDeposit Max deposit value in wei
   */
    function setMaxDeposit(uint256 newMaxDeposit) external;
}
