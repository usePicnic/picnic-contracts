const { ethers } = require("hardhat");
const hre = require("hardhat");

async function main() {

    const [deployer] = await ethers.getSigners();

    console.log(
        "Deploying contracts with the account:",
        deployer.address
    );

    console.log("Account balance:", (await deployer.getBalance()).toString());

    const router = await ethers.getContractAt(nameOrAbi = "UniswapV2Router02",
        address = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D")


    console.log("Pool address:", router.address);

    const WETH = await router.WETH()
    console.log("WETH address:", WETH);
    const UNI = "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984"


    let overrides = {value: ethers.utils.parseEther("1.0")}

    const result = await router.swapExactETHForTokens(
        amountOutMin = 8,
        path = [WETH, UNI],
        to = deployer.address,
        deadline = Date.now() + 100000,
        overrides
    );

    console.log("Result:", result);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });