import { task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import "solidity-coverage";
import "hardhat-gas-reporter";
import "@tenderly/hardhat-tenderly";
import "@nomiclabs/hardhat-etherscan";

require('dotenv').config()
require('hardhat-contract-sizer');

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (args, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(await account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const gwei = 1000000000;

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.6",
        settings: {
          optimizer: { enabled: true, runs: 200 },
        },
      },
    ],
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      forking: {
        url: `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_KEY}`, 
      }
    },
    polygon: {
      url: `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: {
        mnemonic: process.env.POLYGON_TEST_MNEMONIC
      },
      gasPrice: 60*gwei
    }
  },
  etherscan: {
    apiKey: process.env.POLYGON_SCAN
  },
  mocha: { timeout: '1800000'},
  gasReporter: {
    currency: 'USD',
    gasPrice: 1,
  }
};

