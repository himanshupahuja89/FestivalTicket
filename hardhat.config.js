require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.1",
  networks: {
    localhost: {
      url: `http://127.0.0.1:8545/`,
      accounts: [`${process.env.LOCAL_PRIVATE_KEY}`],
    }
  },
  etherscan:{
    apiKey: `${process.env.ETHERSCAN_PRIVATE_KEY}`
  }
};
