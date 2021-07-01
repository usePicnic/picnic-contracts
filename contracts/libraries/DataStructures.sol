pragma solidity 0.8.6;

struct Index {
    address creator;
    uint256[] allocation;
    address[] tokens;
    uint256 fee;
    uint256 creatorFeeCashOut;
    uint256 protocolFeeCashOut;
    mapping(address => mapping(address => uint256)) shares; // Token address -> user address -> shares
}

struct OutputIndex {
    address creator;
    uint256[] allocation;
    address[] tokens;
    uint256 fee;
    uint256 creatorFeeCashOut;
    uint256 protocolFeeCashOut;
}
