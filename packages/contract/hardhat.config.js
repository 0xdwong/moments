require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require('@openzeppelin/hardhat-upgrades');
require('hardhat-abi-exporter');

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ 'path': path.join(path.resolve(__dirname, '.'), '.env') });


const mnemonic = process.env.MNEMONIC;
const providerUrl = process.env.PROVIDER_URL;
const scankey = process.env.ETHERSCAN_API_KEY;
const privateKey = process.env.PRIVATE_KEY


module.exports = {
    solidity: {
        compilers: [{
            version: "0.8.4",
        }]
    },
    defaultNetwork: 'hardhat',
    settings: {
        optimizer: {
            enabled: true,
            runs: 200
        },
    },
    networks: {
        hardhat: {
            chainId: 31337,
            accounts: {
                count: 10,
                initialIndex: 0,
                mnemonic,
                path: "m/44'/60'/0'/0",
                accountsBalance: '10000000000000000000000', // (10000 ETH)
            },
        },
        localhost: {
            url: "http://127.0.0.1:8545",
            chainId: 31337,
            accounts: {
                count: 10,
                initialIndex: 0,
                mnemonic,
                path: "m/44'/60'/0'/0",
                accountsBalance: '10000000000000000000000', // (10000 ETH)
            },
        },
        main: {
            url: providerUrl,
            accounts: {
                count: 1,
                initialIndex: 0,
                mnemonic,
                path: "m/44'/60'/0'/0",
            },
            chainId: 1,
        },
        goerli: {
            url: 'https://rpc.ankr.com/eth_goerli',
            accounts: [privateKey],
            chainId: 5,
        },
        polygon: {
            url: 'https://polygon.llamarpc.com',
            accounts: [privateKey],
            chainId: 137,
        },
    },
    etherscan: {
        apiKey: scankey
    },
    abiExporter: {
        path: './deployments/abi',
        runOnCompile: true,
        clear: true,
        flat: true,
        spacing: 2,
        pretty: true,
    }
};