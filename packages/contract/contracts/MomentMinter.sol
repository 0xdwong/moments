//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./interface/IMoment.sol";

contract MomentMinter is Initializable, OwnableUpgradeable {
    IMoment public moment;

    uint256 public startTokenId;

    event Claimed(uint256 indexed tokenId, address indexed sender);
    event MomentCreated(
        address indexed author,
        uint256 indexed tokenId,
        IMoment.MomentData momentData
    );

    constructor() {}

    function initialize(address moment_) public initializer {
        __Ownable_init();

        moment = IMoment(moment_);

        startTokenId = 10000;
    }

    function createMoment(
        IMoment.MomentData calldata momentData,
        bytes calldata data
    ) external {
        while (moment.exists(startTokenId)) {
            startTokenId += 1;
        }

        moment.create(msg.sender, startTokenId, momentData, data);

        emit MomentCreated(msg.sender, startTokenId, momentData);

        startTokenId += 1;
    }

    function claim(uint256 tokenId) external payable {
        IMoment.MomentData memory momentData = moment.getMonment(tokenId);

        if (momentData.supply > 0)
            require(
                moment.curSupply(tokenId) < momentData.supply,
                "Over limit"
            );

        require(block.timestamp > momentData.startTs, "Not in time");

        if (momentData.endTs > 0)
            require(block.timestamp <= momentData.endTs, "Not in time");

        moment.mint(msg.sender, tokenId, 1, "0x");

        emit Claimed(tokenId, msg.sender);
    }
}
