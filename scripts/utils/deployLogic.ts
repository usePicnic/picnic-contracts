import { ethers, tenderly } from "hardhat";
import { readFileSync } from "fs";

const hre = require("hardhat");

type DeployLogicProps = {
    networkName: string,
    contractName: string,
    interfaceName: string,
    filePath: string,
    nonce: number
}

const deployLogic = async ({ networkName, contractName, interfaceName , filePath, nonce } : DeployLogicProps):Promise<boolean> => {
    console.log(`Deploying ${contractName}...`);
    let contractInterface = await ethers.getContractFactory(contractName);

    const deployedContract = await contractInterface.deploy({'nonce': nonce});

    await deployedContract.deployed();

    console.log(`${contractName} contract deployed on ${networkName} at: ${deployedContract.address}`);

    const contractFile = readFileSync(
        filePath,
        'utf8')
    const contract = JSON.parse(contractFile)

    let insertData = {
        networkName: networkName,
        name: contractName,
        interfaceName: interfaceName,
        address: deployedContract.address,
        isBridge: true,
        abi: contract['abi']
    }
    
    const data = JSON.stringify(insertData, null, 2);
    console.log(data);
    await tenderly.verify({
        name: contractName,
        address: deployedContract.address
    });        

    await hre.run("verify:verify", {
        address: deployedContract.address
    });

    return Promise.resolve(true);
}

export default deployLogic;
