import {expect} from "chai";
import {ethers} from "hardhat";
import constants from "../constants";

describe("AutofarmDepositBridge", function () {
    let owner;
    let autofarmAddressToPoolId;

    const TOKENS = constants['POLYGON']['TOKENS'];

    beforeEach(async function () {
        // Get 2 signers to enable to test for permission rights
        [owner] = await ethers.getSigners();

        let AutofarmAddressToPoolId = await ethers.getContractFactory("AutofarmAddressToPoolId");
        autofarmAddressToPoolId = await AutofarmAddressToPoolId.deploy();

        // Avoid filling up whole list more than 1 time
        await autofarmAddressToPoolId.getPoolId("0x1Bd06B96dd42AdA85fDd0795f3B4A79DB914ADD5");
    });

    describe("Actions", function () {
        it("Check address -> PoolId logic", async function () {
            expect(await autofarmAddressToPoolId.getPoolId("0x1Bd06B96dd42AdA85fDd0795f3B4A79DB914ADD5")).to.be.equal(8);
        });

        it("Revert non-existent poolId", async function () {
            await expect(autofarmAddressToPoolId.getPoolId(TOKENS['amDAI'])
                ).to.be.revertedWith("ASSET NOT AVAILABLE IN AUTOFARM");
        });
    });
});
