pragma solidity ^0.8.6;

// TODO are there any risks in using this experimental ABIEncoderV2? Reference: Aave uses it also
pragma experimental ABIEncoderV2;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IWallet.sol";

/**
 * @title Wallet
 * @author IndexPool
 *
 * @notice Wallet holds assets for an NFT and it interact with bridges to integrate with other DeFi protocols.
 *
 * @dev Wallet holds the funds and is quite extensible as we decided to go with an architecture of delegate calls and
 * bridges, which are contracts that shapes the interfaces we interact with other protocols.
 */
contract Wallet is IWallet {
    address creator;

    // Wallet only talks with IndexPool contract
    modifier _ownerOnly_() {
        require(
            creator == msg.sender,
            "WALLET: ONLY WALLET OWNER CAN CALL THIS FUNCTION"
        );
        _;
    }

    // This is needed for Wallet to receive funds from a contract
    event Received(address sender, uint256 amount);

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    constructor() {
        creator = msg.sender;
    }

    /**
      * @notice This is how the Wallet interact with DeFi protocols.
      *
      * @dev This gives the bridges control over the Wallet funds, so they can make all the transactions necessary to
      * build a portfolio. We need to ensure that all the bridges we support on the UI are as safe as they can be.
      *
      * @param _bridgeAddresses Addresses of deployed bridges that will be called
      * @param _bridgeEncodedCalls Encoded calls to be passed on to delegate calls
      */
    function write(
        address[] calldata _bridgeAddresses,
        bytes[] calldata _bridgeEncodedCalls
    ) external override _ownerOnly_ {
        bool isSuccess;
        bytes memory result;

        for (uint16 i = 0; i < _bridgeAddresses.length; i++) {
            (isSuccess, result) = _bridgeAddresses[i].delegatecall(_bridgeEncodedCalls[i]);
            // Assembly code was the only way we found to display clean revert error messages from delegate calls
            if (isSuccess == false) {
                assembly {
                    let ptr := mload(0x40)
                    let size := returndatasize()
                    returndatacopy(ptr, 0, size)
                    revert(ptr, size)
                }
            }
        }
    }

    // TODO using different data structure here than in IndexPool.sol
    /**
      * @notice Withdraw funds from wallet back to NFT owner.
      *
      * @dev Transfer requested percentages back to NFT owner.
      *
      * @param outputTokens ERC20 token addresses that will exit the Wallet and go to NFT owner
      * @param outputPercentages ERC20 token percentages that will exit the Wallet and go to NFT owner
      * @param outputEthPercentage percentage of ETH that will exit the Wallet and go to NFT owner
      * @param user NFT owner address
      */
    function withdraw(
        address[] calldata outputTokens,
        uint256[] calldata outputPercentages,
        uint256 outputEthPercentage,
        address nftOwner) external override _ownerOnly_ returns (uint256[] memory, uint256){

        uint256[] memory outputTokenAmounts = new uint256[](outputTokens.length);
        for (uint16 i = 0; i < outputTokens.length; i++) {
            require(outputPercentages[i] > 0, "INDEXPOOL WALLET: ERC20 TOKENS WITHDRAWS NEED TO BE > 0");
            outputTokenAmounts[i] = IERC20(outputTokens[i]).balanceOf(address(this)) * outputPercentages[i] / 100000;
            IERC20(outputTokens[i]).transfer(nftOwner, outputTokenAmounts[i]);
        }
        uint256 outputEthAmount;
        if (outputEthPercentage > 0) {
            outputEthAmount = address(this).balance * outputEthPercentage / 100000;
            payable(nftOwner).transfer(outputEthAmount);
        }

        return (outputTokenAmounts, outputEthAmount);
    }

    // TODO should we have a read function? or should we read all data we need from events?
    //    function read(
    //        address[] calldata _bridgeAddresses,
    //        bytes[] calldata _bridgeEncodedCalls
    //    ) external view override _ownerOnly_ {
    //    }
}
