require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      { version: "0.8.18" },
      { version: "0.8.16" },
      { version: "0.7.6" },
      { version: "0.6.6" },
      { version: "0.5.14" },
    ],
  },
};
