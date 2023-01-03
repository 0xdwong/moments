const { ethers, upgrades } = require('hardhat');
const { use, expect } = require('chai');
const { solidity } = require('ethereum-waffle');
use(solidity);


async function revertBlock(snapshotId) {
  await ethers.provider.send('evm_revert', [snapshotId]);
  const newSnapshotId = await ethers.provider.send('evm_snapshot');
  return newSnapshotId;
}

const momentData = {
  'uri': 'uri',
  'content': 'content',
  'startTs': 0,
  'endTs': 0,
  'supply': 0,
}

const createMomentParams = {
  momentData,
  'data': '0x'
}

describe('MomentMinter', async () => {
  let momentInst;
  let momentMinterInst;
  let accounts, owner;
  let snapshotId;
  let minter;
  let InitStartTokenId;

  before(async () => {
    const Moment = await ethers.getContractFactory('Moment');
    momentInst = await upgrades.deployProxy(Moment, ['']);
    await momentInst.deployed();


    const MomentMinter = await ethers.getContractFactory('MomentMinter');
    momentMinterInst = await upgrades.deployProxy(MomentMinter, [momentInst.address]);
    await momentMinterInst.deployed();

    InitStartTokenId = (await momentMinterInst.startTokenId()).toNumber();

    accounts = await ethers.getSigners();
    owner = accounts[0];
    minter = momentMinterInst;

    // set minter
    await momentInst.setMinter(minter.address, true);

    snapshotId = await ethers.provider.send('evm_snapshot');
  })

  afterEach(async () => {
    snapshotId = await revertBlock(snapshotId);
  });

  it('startTokenId', async () => {
    expect(await momentMinterInst.startTokenId()).to.equal(10000);
  });

  it('moment address', async () => {
    expect(await momentMinterInst.moment()).to.equal(momentInst.address);
  });

  describe('createMoment()', () => {
    let { momentData, data } = createMomentParams;
    let author;
    let signer;

    before(async () => {
      signer = owner;
      author = accounts[2];
    })

    it('should create moment', async () => {
      await momentMinterInst.connect(author).createMoment(momentData, data);

      let nextTokenId = (await momentMinterInst.startTokenId()).toNumber();
      expect(nextTokenId).to.equal(InitStartTokenId + 1);

      {
        // moment
        expect(await momentInst.authors(InitStartTokenId)).to.equal(author.address);
        expect(await momentInst.curSupply(InitStartTokenId)).to.equal(1);
      }
    });

    it('should emit MomentCreated event', async () => {
      const momentDataArray = [momentData.uri, momentData.content, momentData.startTs, momentData.endTs, momentData.supply];
      await expect(
        momentMinterInst.connect(author).createMoment(momentData, data)
      ).to.emit(momentMinterInst, 'MomentCreated')
        .withArgs(author.address, InitStartTokenId, momentDataArray);
    });
  });
});