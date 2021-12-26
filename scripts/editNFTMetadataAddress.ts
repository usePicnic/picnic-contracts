import constants from "../constants";
import {MongoClient} from "mongodb";
import {ethers} from "hardhat";

const getDeployedAddress = async (contractName, client) => {
    return (await client
        .db(process.env.MONGODB_DATABASE_NAME)
        .collection('contracts')
        .findOne(
            {
                'name': contractName
            }
        ))['address'];
}

async function main() {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    let nonce = await deployer.getTransactionCount();
    console.log('Starting nonce:', nonce);

    let defibasket = await ethers.getContractAt("DeFiBasket",
        await getDeployedAddress("DeFiBasket", client));

    console.log('Initial URI:', await defibasket.tokenURI(0));

    let tx = await defibasket.setBaseURI("https://dev.defibasket.org/api/get-nft-metadata/", {'nonce': nonce});
    await tx.wait();

    console.log('End URI:',await defibasket.tokenURI(0));
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
