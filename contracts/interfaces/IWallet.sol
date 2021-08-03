pragma solidity >=0.8.6;

interface IWallet {
    function deposit(address bridgeAddress, address token, address[] path);

    function withdraw(address bridgeAddress, address token, address[] path);

    function viewEthHoldings(address bridgeAddress, address token, address[] path);
}
