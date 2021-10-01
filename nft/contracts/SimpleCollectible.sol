// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.6.6;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract SimpleCollectible is ERC721 {
  uint256 public tokenCounter;

  constructor(string memory _name, string memory _ticker) public ERC721(_name, _ticker) {
    tokenCounter = 0;
  }

  function createCollectible(string memory _tokenUri) public returns(uint256){
    uint256 newTokenId = tokenCounter;
    _safeMint(msg.sender, newTokenId);
    _setTokenURI(newTokenId, _tokenUri);
    tokenCounter += 1;
  }

}