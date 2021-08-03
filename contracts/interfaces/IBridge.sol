pragma solidity >=0.8.6;

interface IBridge {
    function deposit(address token, address[] path) external;

    function withdraw(address token, uint256 amount, address[] path) external;

    function viewHoldings(address token, address[] path) external view returns (uint256[]);

    function viewEthHoldings(address token, address[] path) external view returns (uint256[]);
}
