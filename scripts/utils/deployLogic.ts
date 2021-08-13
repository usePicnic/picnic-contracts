import { ethers } from "hardhat";
require('dotenv').config()
import { readFileSync } from "fs";
import {MongoClient} from 'mongodb';

async function deployLogic(contractName: string, isBridge: boolean) {
    console.log(contractName)

    const uri = process.env.MONGODB_URI;
    // @ts-ignore
    const client = new MongoClient(uri, {useNewUrlParser: true, useUnifiedTopology: true});
    await client.connect();

    // TODO add logic to support multiple blockchains
    let mongoContract = await client.db('indexpool').collection('contracts').findOne({'name':contractName});

    if (mongoContract !== undefined){
        console.log(`${contractName} is already deployed. If you want to redeploy it, please undeploy it first.`)
        return
    }

    console.log(`Deploying ${contractName}:`);
    let contractInterface = await ethers.getContractFactory(contractName);
    const deployedContract = await contractInterface.deploy();

    console.log(`${contractName} contract deployed at: ${deployedContract.address}`);

    let filePath;
    if (isBridge) {
        filePath = `./artifacts/contracts/bridges/${contractName}.sol/${contractName}.json`;
    }
    else {
        filePath = `./artifacts/contracts/${contractName}.sol/${contractName}.json`;
    }

    const contractFile = readFileSync(
        filePath,
        'utf8')
    const contract = JSON.parse(contractFile)

    let network = await client.db('indexpool').collection('networks').findOne({'name':'polygon'});

    let insertData = {
        network: network['_id'],
        name: contractName,
        address: deployedContract.address,
        abi: contract['abi']
    }

    await client.db('indexpool').collection('contracts').insertOne(insertData)
    console.log(`${contractName} inserted into DB.`)
}

export default deployLogic;
