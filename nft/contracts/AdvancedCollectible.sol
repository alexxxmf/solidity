// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.6.6;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@chainlink/contracts/src/v0.6/VRFConsumerBase.sol";

contract AdvancedCollectible is ERC721, VRFConsumerBase {
  uint256 public tokenCounter;
  enum Breed{
    PUG,
    SHIBA_INU,
    ST_BERNARD
  }
  bytes32 keyhash;
  uint256 fee;
  mapping(uint256 => Breed) public tokenIdToBreed;
  mapping(bytes32 => address) public requestIdToSender;

  event RequestedCollectible(bytes32 indexed _requestId, address _requester);
  event BreedAssigned(uint256 indexed tokenId, Breed breed);
  // What does the indexed keyword do?
  // https://ethereum.stackexchange.com/questions/8658/what-does-the-indexed-keyword-do

  constructor(
    string memory _name,
    string memory _ticker,
    address _vrfCoordinator,
    address _linkToken
    bytes32 _keyhash,
    uint256 _fee
  ) public 
  ERC721(_name, _ticker)
  VRFConsumerBase(_vrfCoordinator, _linkToken)
  {
    tokenCounter = 0;
    keyhash = _keyhash;
    fee = _fee;
  }

  function createCollectible() public{
    bytes32 requestId = requestRandomness(keyhash, fee);
    requestIdToSender[requestId] = msg.sender;
    emit RequestedCollectible(requestId);
  }

  function fulfillRandomness(bytes32 _requestId, uint256 _randomness)
    internal
    override 
  {
    uint256 newTokenId = tokenCounter;
    Breed breed = Breed[randomness % 3];
    tokenIdToBreed[newTokenId] = breed;
    emit BreedAssigned(newTokenId, breed);
    address owner = requestIdToSender[_requestId];
    _safeMint(owner, newTokenId);
    tokenCounter = tokenCounter + 1;
  }

  function setTokenURI(uint256 tokenId, string memory _tokenURI) public {
    require(_isApprovedOrOwner(_msgSender(), tokenId), "ERC721: caller is not owner or not approved");
    _setTokenURI(tokenId, _tokenURI);
  }
}