pragma solidity 0.8.6;

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
