const { ethers, network, upgrades } = require("hardhat");
const { writeAddr } = require('./recoder.js');
const { getImplementationAddress } = require('@openzeppelin/upgrades-core');

async function main() {
    let [owner] = await ethers.getSigners();
    console.log('\ndeployer:', owner.address);

    const Moment = await ethers.getContractFactory('Moment');
    const MomentMinter = await ethers.getContractFactory('MomentMinter');

    // 部署Moment
    let momentInst;
    {
        const Uri = '';
        momentInst = await upgrades.deployProxy(Moment, [Uri]);
        await momentInst.deployed();

        console.log('\nMoment proxy deployed to:', momentInst.address);
    }

    // 部署 MomentMinter
    let momentMinterInst;
    {
        const momentAddr = momentInst.address;

        momentMinterInst = await upgrades.deployProxy(MomentMinter, [momentAddr]);
        await momentMinterInst.deployed();
        console.log('\nMomentMinter proxy deployed to:', momentMinterInst.address);
    }

    // 初始化操作
    {
        await momentInst.connect(owner).setMinter(momentMinterInst.address, true);
        console.log('\nMoment setMinter', momentMinterInst.address);
    }

    {
        // 记录地址
        await writeAddr(momentInst.address, 'Moment', network.name);
        await writeAddr(momentMinterInst.address, 'MomentMinter', network.name);
    }

    {
        const badgeLogicAddr = await getImplementationAddress(ethers.provider, momentInst.address);
        const quesMinterLogicAddr = await getImplementationAddress(ethers.provider, momentMinterInst.address);

        // 开源认证
        if (!['hardhat', 'localhost'].includes(network.name)) {
        console.log(`\nPlease verify implementation address [Moment]:\n npx hardhat verify ${badgeLogicAddr} --network ${network.name}`);
        console.log(`\nPlease verify implementation address [MomentMinter]:\n npx hardhat verify ${quesMinterLogicAddr} --network ${network.name}`);
        }
    }
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });