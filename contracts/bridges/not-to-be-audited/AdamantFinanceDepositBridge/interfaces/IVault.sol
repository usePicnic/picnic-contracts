pragma solidity ^0.8.6;

interface IVault {
    function deposit(uint256 amount) external;

    function withdraw(uint256 amount) external;
}