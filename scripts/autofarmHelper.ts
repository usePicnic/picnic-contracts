import {ethers} from "hardhat";
import constants from "../constants";
import {BigNumber} from "ethers";
import {MongoClient} from "mongodb";

const weiToString = (wei) => {
    return wei
        .div(
            BigNumber.from(10).pow(14)
        )
        .toNumber() / Math.pow(10, 4);
}

const getDeployedAddress = async (contractName, client) => {
    return (await client
        .db('indexpool')
        .collection('contracts')
        .findOne(
            {
                'name': contractName
            }
        ))['address'];
}

async function main() {
    const [deployer] = await ethers.getSigners();
    const balanceBegin = await deployer.getBalance();
    console.log("Deploying from:", deployer.address);
    console.log("Account balance:", weiToString(balanceBegin));

    let contractInterface = await ethers.getContractFactory('AutoFarmAddressToPoolId');
    const autoFarmAddressToPoolId = await contractInterface.deploy();

    console.log('autofarmAddressToPoolId address:', autoFarmAddressToPoolId.address);

    await autoFarmAddressToPoolId.getPoolId('0x1Bd06B96dd42AdA85fDd0795f3B4A79DB914ADD5', {gasLimit: 10000000});

    console.log("Mint succeeded:", weiToString(balanceBegin));
    console.log("Account balance:", weiToString(balanceBegin));

}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
