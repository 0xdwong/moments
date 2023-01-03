//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IMoment {
    struct MomentData {
        string uri;
        string content;
        uint32 startTs;
        uint32 endTs;
        uint192 supply;
    }

    function exists(uint256 tokenId) external view returns (bool);

    function curSupply(uint256 tokenId) external view returns (uint256);

    function getMonment(uint256 tokenId)
        external
        view
        returns (MomentData memory momentData);

    function create(
        address author,
        uint256 id,
        MomentData calldata momentData,
        bytes memory _data
    ) external returns (uint256);

    function mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) external;
}
