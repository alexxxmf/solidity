// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.6.6;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract SimpleCollectible is ERC721 {
  constructor(string memory _name, string memory _ticker) public ERC721(_name, _ticker) {
    
  }
}