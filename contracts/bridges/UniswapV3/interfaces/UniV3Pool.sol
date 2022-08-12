// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

interface UniV3Pool {

    function fee() external view returns (uint24);
}
