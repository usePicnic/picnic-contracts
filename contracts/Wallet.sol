pragma solidity ^0.8.6;

import "./interfaces/IWallet.sol";
import "./libraries/IPDataTypes.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

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
    using SafeERC20 for IERC20;

    address _owner;

    // Wallet only talks with IndexPool contract
    modifier ownerOnly() {
        require(
            _owner == msg.sender,
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
        _owner = msg.sender;
    }

    /**
      * @notice This is how the Wallet interact with DeFi protocols.
      *
      * @dev This gives the bridges control over the Wallet funds, so they can make all the transactions necessary to
      * build a portfolio. We need to ensure that all the bridges we support on the UI are as safe as they can be.
      * Example of bridges are UniswapV2SwapBridge and AaveV2DepositBridge.
      *
      * @param _bridgeAddresses Addresses of deployed bridge contracts
      * @param _bridgeEncodedCalls Encoded calls to be passed on to delegate calls
      */
    function useBridges(
        address[] calldata _bridgeAddresses,
        bytes[] calldata _bridgeEncodedCalls
    ) external override ownerOnly {
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

    /**
      * @notice Withdraw funds from wallet back to NFT owner.
      *
      * @dev Transfer requested percentages back to NFT owner.
      *
      * @param outputs ERC20 token addresses and percentages that will exit the Wallet and go to NFT owner
      * @param outputEthPercentage percentage of ETH that will exit the Wallet and go to NFT owner
      * @param nftOwner NFT owner address
      */
    function withdraw(
        IPDataTypes.TokenData calldata outputs,
        uint256 outputEthPercentage,
        address nftOwner
    ) external ownerOnly override returns (uint256[] memory, uint256)
    {
        // Withdraws ERC20 tokens
        uint256[] memory outputTokenAmounts = new uint256[](outputs.tokens.length);
        for (uint16 i = 0; i < outputs.tokens.length; i++) {
            outputTokenAmounts[i] = IERC20(outputs.tokens[i]).balanceOf(address(this)) * outputs.amounts[i] / 100000;
            IERC20(outputs.tokens[i]).safeTransfer(nftOwner, outputTokenAmounts[i]);
        }

        // Withdraws ETH
        uint256 outputEthAmount = 0;
        if (outputEthPercentage > 0) {
            outputEthAmount = address(this).balance * outputEthPercentage / 100000;
            payable(nftOwner).transfer(outputEthAmount);
        }

        return (outputTokenAmounts, outputEthAmount);
    }
}
