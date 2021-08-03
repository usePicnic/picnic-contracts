pragma solidity >=0.8.6;

import "./interfaces/IWallet.sol";
import "./interfaces/IBridge.sol";


contract Wallet is IWallet {
    constructor(uint256 nftId) {
        uint256 _nftId = nftId;
    }

    modifier _ownerOnly_() {
        require(msg.sender == nft.ownerOf(nftId), "ONLY WALLET OWNER CAN CALL THIS FUNCTION");
        _;
    }

    event Received(address sender, uint256 amount);

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    function deposit(address bridgeAddress, address token, address[] path) _ownerOnly_ {
        IBridge bridge = IBridge(bridgeAddress);
        bridge.deposit(token, path);
    }

    function withdraw(address bridgeAddress, address token, address[] path) _ownerOnly_ {
        IBridge bridge = IBridge(bridgeAddress);
        bridge.withdraw(token, path);
    }

    function viewEthHoldings(address bridgeAddress, address token, address[] path) _ownerOnly_ {
        IBridge bridge = IBridge(bridgeAddress);
        bridge.viewEthHoldings(token, path);
    }
}
