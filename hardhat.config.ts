import { task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import "solidity-coverage";
import "hardhat-gas-reporter";


// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (args, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(await account.address);
  }
});

import { BINANCE_ADDRESS, BINANCE7_ADDRESS, DAI_RICH_ADDRESS } from './Constants';

task("impersonate", "Impersonate accounts", async (args, hre) => {

  console.log('Impersonate accounts...');

  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [BINANCE_ADDRESS],
  });

  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [BINANCE7_ADDRESS],
  });

  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [DAI_RICH_ADDRESS],
  });

  console.log('Done!');

});



// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const ALCHEMY_API_KEY = "sgtHN_pBug6FW_l81ENj6Np5CcG0EXHT";
const GOERLI_PRIVATE_KEY = "d781d2d6113c2ad4ce4d18653f5140476c3dca7eac4889a2af6148d241867812";

const DEFAULT_BLOCK_GAS_LIMIT = 12450000;
const DEFAULT_GAS_MUL = 5;
const DEFAULT_GAS_PRICE = 65000000000;

const gwei = 1000000000;

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.4.21"
      },
      {
        version: "0.4.24"
      },
      {
        version: "0.8.4",
      }
    ],
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  defaultNetwork: "hardhat",
  networks: {
    // hardhat: {
    //   forking: {
    //     url: `https://eth-goerli.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
    //     blockNumber: 4572970,
    //   }  
    // },
    hardhat: {
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
        blockNumber: 12182008,
        accounts: [BINANCE_ADDRESS, BINANCE7_ADDRESS, DAI_RICH_ADDRESS]
      }
    },
    goerli: {
      url: `https://eth-goerli.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
      accounts: [`0x${GOERLI_PRIVATE_KEY}`],
      // blockGasLimit: DEFAULT_BLOCK_GAS_LIMIT,
      // gasMultiplier: DEFAULT_GAS_MUL,
      // gasPrice: DEFAULT_GAS_PRICE,
    },
    binance_testnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      accounts: [`0x${GOERLI_PRIVATE_KEY}`],
      chainId: 97,
      gasPrice: 12 * gwei,
    },
    binance: {
      url: "https://bsc-dataseed.binance.org/",
      accounts: [`0x${GOERLI_PRIVATE_KEY}`], // TODO better manage keys (github secrets?)
      chainId: 56,
      gasPrice: 5 * gwei,
    }
  },
  gasReporter: {
    currency: 'USD',
    gasPrice: 1,
    coinmarketcap: "30f0032e-e9a6-430c-87ae-5a00f1627c62"
  }
};

