// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

interface ISynthereumWrapper{  
    function unwrap(uint256 _tokenAmount, address _recipient)
        external
    returns (uint256 amountCollateral);

    function wrap(uint256 _collateral, address _recipient)
        external
    returns (uint256 amountTokens);
}


