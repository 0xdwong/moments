// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./interface/IMoment.sol";

contract Moment is IMoment, OwnableUpgradeable, ERC1155Upgradeable {
    mapping(uint256 => address) public authors;
    mapping(uint256 => uint256) private _curSupply;
    mapping(address => bool) public minters;
    mapping(uint256 => MomentData) public moments;

    event SetMinter(address minter, bool enabled);

    string public name;
    string public symbol;

    constructor() {}

    function initialize(string memory uri_) public initializer {
        __Ownable_init();
        __ERC1155_init(uri_);
        name = "Moments";
        symbol = "MMTS";
    }

    modifier onlyMinter() {
        require(minters[msg.sender], "Only minter");
        _;
    }

    function setMinter(address minter, bool enabled) external onlyOwner {
        require(minter != address(0), "Invalid minter");
        minters[minter] = enabled;
        emit SetMinter(minter, enabled);
    }

    /**
     * @notice Block transfers
     */
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override(ERC1155Upgradeable) {
        require(
            from == address(0) || to == address(0),
            "NonTransferrableERC1155Token: non-transferrable"
        );
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    /**
     * @notice Block approvals
     */
    function setApprovalForAll(address, bool)
        public
        virtual
        override(ERC1155Upgradeable)
    {
        revert("NonApprovableERC1155Token: non-approvable");
    }

    function getMonment(uint256 tokenId)
        external
        view
        override
        returns (MomentData memory)
    {
        return moments[tokenId];
    }

    function create(
        address author,
        uint256 tokenId,
        MomentData calldata momentData,
        bytes memory data
    ) external override onlyMinter returns (uint256) {
        return _create(author, tokenId, momentData, data);
    }

    function exists(uint256 tokenId) external view override returns (bool) {
        return _exists(tokenId);
    }

    function curSupply(uint256 tokenId)
        external
        view
        override
        returns (uint256)
    {
        return _curSupply[tokenId];
    }

    function mint(
        address to,
        uint256 tokenId,
        uint256 amount,
        bytes memory data
    ) external override onlyMinter {
        require((balanceOf(to, tokenId) == 0), "Already minted");

        _mint(to, tokenId, amount, data);
        _curSupply[tokenId] += amount;
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "None existent token");

        return moments[tokenId].uri;
    }

    function _create(
        address author,
        uint256 tokenId,
        MomentData calldata momentData,
        bytes memory data
    ) internal returns (uint256) {
        require(!_exists(tokenId), "TokenId already exists");
        moments[tokenId] = momentData;
        authors[tokenId] = author;

        _mint(author, tokenId, 1, data);

        _curSupply[tokenId]++;

        return tokenId;
    }

    /**
     * @dev Returns whether the specified token exists by checking to see if it has a author
     * @param tokenId uint256 ID of the token to query the existence of
     * @return bool whether the token exists
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return authors[tokenId] != address(0);
    }
}
