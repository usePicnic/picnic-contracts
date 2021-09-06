pragma solidity ^0.8.6;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../interfaces/IAutofarmV2_CrossChain.sol";
import "hardhat/console.sol";

contract AutoFarmAddressToPoolId {
    mapping(address=>uint256) poolMapper;
    uint256 updatedLen = 0;

    function getPoolId(address asset) external returns (uint256) {
        address autofarmAddress = 0x89d065572136814230A55DdEeDDEC9DF34EB0B76;
        IAutofarmV2_CrossChain autofarm = IAutofarmV2_CrossChain(autofarmAddress);

        updatePools();

        uint256 poolId = poolMapper[asset];
        (IERC20 a, uint256 b, uint256 c, uint256 d, address e) = autofarm.poolInfo(poolId);
        require(address(a) == asset, "ASSET NOT AVAILABLE IN AUTOFARM");
        return poolId;
    }

    function updatePools() internal {
        address autofarmAddress = 0x89d065572136814230A55DdEeDDEC9DF34EB0B76;
        IAutofarmV2_CrossChain autofarm = IAutofarmV2_CrossChain(autofarmAddress);

        uint256 len = autofarm.poolLength();
        if (len > updatedLen) {
            for (uint256 i = updatedLen; i < len; i++) {
                (IERC20 a, uint256 b, uint256 c, uint256 d, address e) = autofarm.poolInfo(i);
                poolMapper[address(a)] = i;
                updatedLen += 1;
            }
        }
    }
}