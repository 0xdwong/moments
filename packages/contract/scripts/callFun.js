const { ethers, network } = require("hardhat");
const momentMinterAddr = require(`../deployments/${network.name}/MomentMinter.json`).address;
const momentAddr = require(`../deployments/${network.name}/Moment.json`).address;

let momentMinter;
let moment;
let sender;


async function init() {
    let accounts = await ethers.getSigners();
    sender = accounts[0];
    // console.log('signer.address', signer.address);
    momentMinter = await ethers.getContractAt('MomentMinter', momentMinterAddr);
    moment = await ethers.getContractAt('Moment', momentAddr);
}

async function createMoment() {
    const momentData = {
        uri: 'ipfs://QmU51gmTmRbNWRouqtbZhPkdf3FQxPyDqrpmLzg7Q84na6',
        content: 'Happy new year! 2023',
        startTs: 0,
        endTs: 0,
        supply: 1,
    }

    try {
        await momentMinter.connect(sender).createMoment(momentData, '0x');
        console.log('====createMoment succeed====\n');
    } catch (err) {
        console.log('====createMoment failed====\n', err);
    }
}

async function tokenUri() {
    try {
        const uri = await moment.connect(sender).uri(10000001);
        console.log('====tokenUri====', uri);
    } catch (err) {
        console.log('====tokenUri failed====', err);
    }
}

async function main() {
    await init();

    await createMoment();

    // await tokenUri();
}
main()