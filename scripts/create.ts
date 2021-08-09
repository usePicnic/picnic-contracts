import {ethers} from "hardhat";
import constants from "../constants";

async function main() {

    const [deployer] = await ethers.getSigners();
    const ADDRESSES = constants['POLYGON'];

    console.log(
        "Deploying contracts with the account:",
        deployer.address
    );

    let pool = (await ethers.getContractAt("Pool", "0xe044814c9eD1e6442Af956a817c161192cBaE98F")).connect((deployer))

    console.log(
        "Pool address:",
        pool.address
    );

    let tokens = ADDRESSES['TOKENS'];

    await pool.createIndex(
        tokens, // address[] _tokens
        tokens.map(() => 1000000000),  // uint256[] _allocation,
        tokens.map(x => [x, TOKENS['WMAIN']]), // paths
    );

    console.log("Index created successfully.")

    let indexesLength = await pool.getIndexesLength();

    console.log(`Total of ${indexesLength} indexes`)
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
