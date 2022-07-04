// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;
import "./DeFiBasket.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


contract TxSimulator {
    address defiBasketAddress = 0xee13C86EE4eb1EC3a05E2cc3AB70576F31666b3b;
    DeFiBasket defiBasket = DeFiBasket(defiBasketAddress);

    function createPortfolio(
        DBDataTypes.TokenData calldata inputs,
        address[] calldata bridgeAddresses,
        bytes[] calldata bridgeEncodedCalls,
        address outputToken
    ) payable external returns (uint256) {

    defiBasket.createPortfolio{value:msg.value}(inputs, bridgeAddresses, bridgeEncodedCalls);
    uint256 tokenCounter = defiBasket.tokenCounter();
    address walletAddress = defiBasket.walletOf(tokenCounter - 1);
    return IERC20(outputToken).balanceOf(walletAddress); 
    }
}