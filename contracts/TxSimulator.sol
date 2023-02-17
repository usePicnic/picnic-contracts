// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;
import "./DeFiBasket.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";


contract TxSimulator is IERC721Receiver {
    address defiBasketAddress = 0xee13C86EE4eb1EC3a05E2cc3AB70576F31666b3b;
    DeFiBasket defiBasket = DeFiBasket(defiBasketAddress);
    
    function onERC721Received(address, address, uint256, bytes memory) public virtual override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function simulatePicnicTx(
        DBDataTypes.TokenData calldata inputs,
        address[] calldata bridgeAddresses,
        bytes[] calldata bridgeEncodedCalls,
        address outputToken
    ) external returns (uint256) {
        IERC20(inputs.tokens[0]).approve(defiBasketAddress, inputs.amounts[0]);
        defiBasket.createPortfolio(inputs, bridgeAddresses, bridgeEncodedCalls);
        uint256 tokenCounter = defiBasket.tokenCounter();
        address walletAddress = defiBasket.walletOf(tokenCounter - 1);
        return IERC20(outputToken).balanceOf(walletAddress); 
    }
}