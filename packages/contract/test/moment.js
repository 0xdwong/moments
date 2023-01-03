const { ethers, upgrades } = require("hardhat");
const { use, expect } = require("chai");
const { solidity, MockProvider } = require("ethereum-waffle");
use(solidity);


const provider = new MockProvider();
const REVERT_MSGS = {
  'OnlyMinter': 'Only minter',
  'TokenIdAlreadyExists': 'TokenId already exists',
  'AlreadyMinted': 'Already minted',
}

async function revertBlock(snapshotId) {
  await ethers.provider.send("evm_revert", [snapshotId]);
  const newSnapshotId = await ethers.provider.send("evm_snapshot");
  return newSnapshotId;
}

const AddressZero = ethers.constants.AddressZero;
const createParams = {
  'author': provider.createEmptyWallet().address,
  'tokenId': 1,
  'momentData': {
    'uri': 'uri',
    'content': 'content',
    'startTs': 0,
    'endTs': 0,
    'supply': 0,
  },
  'data': '0x',
}

const mintParams = {
  'to': provider.createEmptyWallet().address,
  'tokenId': 1,
  'amount': 1,
  'data': '0x',
}

describe("Moment", async () => {
  let momentInst;
  let accounts, owner;
  const name = 'Moments';
  const symbol = 'MMTS';
  let snapshotId;
  let minter;

  before(async () => {
    const Moment = await ethers.getContractFactory("Moment");

    const params = [''];
    momentInst = await upgrades.deployProxy(Moment, params);
    await momentInst.deployed();

    accounts = await ethers.getSigners();
    owner = accounts[0];
    minter = accounts[1];

    // set minter
    await momentInst.setMinter(minter.address, true);

    snapshotId = await ethers.provider.send("evm_snapshot");
  })

  afterEach(async () => {
    snapshotId = await revertBlock(snapshotId);
  });

  it("name", async () => {
    expect(await momentInst.name()).to.equal(name);
  });

  it("symbol", async () => {
    expect(await momentInst.symbol()).to.equal(symbol);
  });

  describe('uri()', async () => {
    it("None existent token", async () => {
      await expect(momentInst.uri(0)).to.be.revertedWith('None existent token');
    });

    it("Existent token", async () => {
      //todo
      await expect(momentInst.uri(0)).to.be.revertedWith('None existent token');
    });
  })

  describe('setMinter()', async () => {
    it("set minter", async () => {
      let addr = owner.address;
      await momentInst.connect(owner).setMinter(addr, true);
      const isMinter = await momentInst.minters(addr);
      expect(isMinter).to.equal(true);
    });

    it("unset minter", async () => {
      let addr = owner.address;
      await momentInst.connect(owner).setMinter(addr, false);
      const isMinter = await momentInst.minters(addr);
      expect(isMinter).to.equal(false);
    });

    it("Invalid minter", async () => {
      let addr = AddressZero;
      await expect(momentInst.connect(owner).setMinter(addr, false)).to.be.revertedWith('Invalid minter');

    });

    it("not owner should revert", async () => {
      let addr = accounts[1].address;
      await expect(momentInst.connect(accounts[2]).setMinter(addr, false)).to.be.revertedWith('Ownable: caller is not the owner');
    });
  })

  describe('create()', async () => {
    it("not minter should revert", async () => {
      let { author, tokenId, momentData, data } = createParams;
      await expect(momentInst.connect(accounts[2]).create(author, tokenId, momentData, data)).to.be.revertedWith(REVERT_MSGS['OnlyMinter']);
    });

    it("minter create", async () => {
      let { author, tokenId, momentData, data } = createParams;
      await momentInst.connect(minter).create(author, tokenId, momentData, data);

      let curSupply = await momentInst.curSupply(tokenId);
      expect(curSupply).to.equal(1);

      let author_ = await momentInst.authors(tokenId);
      expect(author_).to.equal(author);

      let balance = await momentInst.balanceOf(author, tokenId);
      expect(balance).to.equal(1);
    });

    it("create exists toekn should revert", async () => {
      let { author, tokenId, momentData, data } = createParams;
      await momentInst.connect(minter).create(author, tokenId, momentData, data);

      // create same tokenId again
      await expect(
        momentInst.connect(minter).create(author, tokenId, momentData, data)
      ).to.be.revertedWith(REVERT_MSGS['TokenIdAlreadyExists']);
    });
  })

  describe('mint()', async () => {
    it("not minter should revert", async () => {
      let { to, tokenId, amount, data } = mintParams;
      await expect(momentInst.connect(accounts[2]).mint(to, tokenId, amount, data)).to.be.revertedWith(REVERT_MSGS['OnlyMinter']);
    });

    it("minter mint", async () => {
      let { to, tokenId, amount, data } = mintParams;
      await expect(
        momentInst.connect(minter).mint(to, tokenId, amount, data)
      ).to.emit(momentInst, 'TransferSingle')
        .withArgs(minter.address, AddressZero, to, tokenId, amount);

      let curSupply = await momentInst.curSupply(tokenId);
      expect(curSupply).to.equal(amount);

      let balance = await momentInst.balanceOf(to, tokenId);
      expect(balance).to.equal(amount);
    });

    it("should emit TransferSingle event", async () => {
      let { to, tokenId, amount, data } = mintParams;
      await expect(
        momentInst.connect(minter).mint(to, tokenId, amount, data)
      ).to.emit(momentInst, 'TransferSingle')
        .withArgs(minter.address, AddressZero, to, tokenId, amount);
    });

    it("mint twice should revert", async () => {
      let { to, tokenId, amount, data } = mintParams;
      await momentInst.connect(minter).mint(to, tokenId, amount, data);

      // mint again
      await expect(
        momentInst.connect(minter).mint(to, tokenId, amount, data)
      ).to.be.revertedWith(REVERT_MSGS['AlreadyMinted']);
    });
  })

  describe('exists()', async () => {
    it("should return false when not exist", async () => {
      let exist = await momentInst.exists(10000);
      expect(exist).to.equal(false);
    });

    it("should return true when exist", async () => {
      let { author, tokenId, momentData, data } = createParams;
      await momentInst.connect(minter).create(author, tokenId, momentData, data);

      let exist = await momentInst.exists(tokenId);
      expect(exist).to.equal(true);
    });
  })

  describe("1155", () => {
    describe("setApprovalForAll()", () => {
      it("Should revert with non-approvable", async () => {
        let operator = provider.createEmptyWallet().address;

        await expect(
          momentInst.setApprovalForAll(operator, true)
        )
          .to.be.revertedWith('non-approvable')
      });
    });
  })
});