pragma solidity ^0.8.6;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../trusted/AutofarmDepositBridge/interfaces/IAutofarmV2_CrossChain.sol";

contract AutofarmAddressToPoolId {
    mapping(address=>uint256) poolMapper;
    uint256 updatedLen = 0;
    address constant autofarmAddress = 0x89d065572136814230A55DdEeDDEC9DF34EB0B76;

    function getPoolId(address strategyPoolAddress) external returns (uint256) {
        IAutofarmV2_CrossChain autofarm = IAutofarmV2_CrossChain(autofarmAddress);

        updatePools();

        uint256 poolId = poolMapper[strategyPoolAddress];
        (, , , , address e) = autofarm.poolInfo(poolId);
        require(e == strategyPoolAddress, "ASSET NOT AVAILABLE IN AUTOFARM");
        return poolId;
    }

    function updatePools() internal {
        IAutofarmV2_CrossChain autofarm = IAutofarmV2_CrossChain(autofarmAddress);

        uint256 len = autofarm.poolLength();
        if (len > updatedLen) {
            for (uint256 i = updatedLen; i < len; i++) {
                (, , , , address e) = autofarm.poolInfo(i);
                poolMapper[e] = i;
                updatedLen += 1;
            }
        }
    }
}
