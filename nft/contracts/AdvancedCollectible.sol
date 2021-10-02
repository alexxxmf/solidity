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
  mapping(bytes32 => address) public equestIdToMinter;

  event RequestedCollectible(bytes32 indexed requestId, address requester);

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
    // uint256 newTokenId = tokenCounter;
    // _safeMint(msg.sender, newTokenId);
    // _setTokenURI(newTokenId, _tokenUri);
    // tokenCounter += 1;
    bytes32 requestId = requestRandomness(keyhash, fee);
    emit RequestedCollectible(requestId);
  }

  function fulfillRandomness(bytes32 _requestId, uint256 _randomness)
    internal
    override 
  {
    Breed breed = Breed[randomness % 3];
  }
}