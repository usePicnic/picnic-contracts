import { ethers, tenderly } from "hardhat";
import { readFileSync } from "fs";
import { MongoClient } from 'mongodb';

type DeployLogicProps = {
    networkName: string,
    contractName: string,
    interfaceName: string,
    filePath: string,
    nonce: number
}

const deployLogic = async ({ networkName, contractName, interfaceName , filePath, nonce } : DeployLogicProps):Promise<boolean> => {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();

        let mongoContract = await client
            .db(process.env.MONGODB_DATABASE_NAME)
            .collection('contracts')
            .findOne(
                {
                    'name': contractName,
                    'networkName': networkName
                }
            );        

        if (mongoContract !== null && mongoContract !== undefined) {
            console.log(`${contractName} is already deployed on ${networkName}. If you want to redeploy it, please undeploy it first.`)
            return Promise.resolve(false);
        }
    
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
            abi: contract['abi']
        }
    
        await client
            .db(process.env.MONGODB_DATABASE_NAME)
            .collection('contracts')
            .insertOne(insertData);
        
        console.log(`${contractName} on ${networkName} inserted into DB.`)

        await tenderly.verify({
            name: contractName,
            address: deployedContract.address
        });        
    
        return Promise.resolve(true);
    } finally {
        await client.close();
    }

}

export default deployLogic;
