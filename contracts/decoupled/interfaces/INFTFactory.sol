pragma solidity >=0.8.6;

interface INFTFactory {
    function newNFT() external returns (address);
}