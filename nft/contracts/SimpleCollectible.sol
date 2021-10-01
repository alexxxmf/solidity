// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.6.6;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract SimpleCollectible is ERC721{
  uint256 public tokenCounter;

  constructor() public ERC721("Soldier", "SLD") {
    tokenCounter = 0;
  }

  function createCollectible() public returns(uint256){
    uint256 newTokenId = tokenCounter;
    _safeMint(msg.sender, newTokenId);
    tokenCounter += 1;
  }

}