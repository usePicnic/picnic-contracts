// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.6;

interface IMerkleOrchard {

    struct Claim {
        uint256 distributionId;
        uint256 balance;
        address distributor;
        uint256 tokenIndex;
        bytes32[] merkleProof;
    }
    
    function claimDistributions(
        address claimer,
        Claim[] memory claims,
        address[] memory tokens
    ) external;
    
}