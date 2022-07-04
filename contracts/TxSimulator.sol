// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;
import "./DeFiBasket.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";


contract TxSimulator is IERC721Receiver {
    address defiBasketAddress = 0xee13C86EE4eb1EC3a05E2cc3AB70576F31666b3b;
    DeFiBasket defiBasket = DeFiBasket(defiBasketAddress);

    function simulateFromNetworkToken(
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


    function onERC721Received(address, address, uint256, bytes memory) public virtual override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function simulateFromAnyToken(
        DBDataTypes.TokenData calldata inputs,
        address[] calldata bridgeAddresses,
        bytes[] calldata bridgeEncodedCalls,
        address inputToken,
        uint256 amountIn,
        address[] calldata bridgeAddressesII,
        bytes[] calldata bridgeEncodedCallsII,
        address outputToken
    ) payable external returns (uint256) {
    // TODO deal with value larger than balance :x

    defiBasket.createPortfolio{value:msg.value}(inputs, bridgeAddresses, bridgeEncodedCalls);

    withdrawFromDummyPortfolio(inputToken);

    return simulateOutput( amountIn,  inputToken, bridgeAddressesII, bridgeEncodedCallsII, outputToken);

    }

    function withdrawFromDummyPortfolio(address inputToken) internal {
        address[] memory tokens = new address[](1);
        tokens[0] = inputToken;

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 100000;

        DBDataTypes.TokenData memory outputs = DBDataTypes.TokenData({tokens: tokens, amounts: amounts});
        uint256 nftId = defiBasket.tokenCounter() - 1;
        uint256 outputEthPercentage = 0;
        address[] memory withdrawBridgeAddresses;
        bytes[] memory withdrawBridgeEncodedCalls;

        defiBasket.withdrawPortfolio(nftId,
            outputs,
            outputEthPercentage,
            withdrawBridgeAddresses,
            withdrawBridgeEncodedCalls);

    }

    function simulateOutput(uint256 amountIn, address inputToken, address[] calldata bridgeAddressesII,
        bytes[] calldata bridgeEncodedCallsII, address outputToken) internal returns (uint256){
        IERC20(inputToken).approve(defiBasketAddress, amountIn);

        address[] memory tokens = new address[](1);
        tokens[0] = inputToken;

        uint256[] memory amountsII = new uint256[](1);
        amountsII[0] = amountIn;

        DBDataTypes.TokenData memory inputsII = DBDataTypes.TokenData({tokens: tokens, amounts: amountsII});


        defiBasket.createPortfolio(inputsII, bridgeAddressesII, bridgeEncodedCallsII);

        address walletAddress = defiBasket.walletOf(defiBasket.tokenCounter() - 1);
        return IERC20(outputToken).balanceOf(walletAddress); 
    }

}