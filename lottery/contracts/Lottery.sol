// SPDX-License-Identifier: MIT
pragma solidity ^0.6.6;

import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.6/VRFConsumerBase.sol";


contract Lottery is Ownable, VRFConsumerBase {
  address payable[] public players;
  address payable public recentWinner;
  uint256 public randomness;
  uint256 public usdEntryFee;
  AggregatorV3Interface internal ethUsdPriceFeed;
  enum LOTTERY_STATE {
    OPEN,
    CLOSED,
    CALCULATING_WINNER
  }
  LOTTERY_STATE public lottery_state;
  uint256 public fee;
  bytes32 public keyhash;
  event RequestedRandomness(bytes32 requestId);
  
  constructor(
    address _priceFeedAddress,
    uint256 _usdEntryFee,
    address _vrfCoordinator,
    address _link,
    uint256 _fee,
    bytes32 _keyhash
  ) public VRFConsumerBase(_vrfCoordinator, _link){
    ethUsdPriceFeed = AggregatorV3Interface(_priceFeedAddress);
    usdEntryFee = _usdEntryFee * (10 ** 18); // we pass it in usd then we convert to 18 decimals
    lottery_state = LOTTERY_STATE.CLOSED;
    fee = _fee;
    keyhash = _keyhash;
  }

  function enter() public payable {
    require(lottery_state == LOTTERY_STATE.OPEN);
    require(msg.value >= getEntranceFee(), "Not enough ETH!");
    players.push(msg.sender);
  }

  function getEntranceFee() public view returns(uint256){
    (
      /*uint80 roundID*/,
      int price,
      /*uint startedAt*/,
      /*uint timeStamp*/,
      /*uint80 answeredInRound*/
    ) = ethUsdPriceFeed.latestRoundData();

    // 18 decimals, price comes with 8 decimals according to chainlink docs
    uint256 adjustedPrice = uint256(price) * 10**10;
    uint256 costToEnter = (usdEntryFee * 10**18) / adjustedPrice;

    return costToEnter;
  }

  function startLottery() public {
    require(
      lottery_state == LOTTERY_STATE.CLOSED,
      "Can't start a new lottery yet!"
    );
    lottery_state = LOTTERY_STATE.OPEN;
  }

  function endLottery() public onlyOwner {
    lottery_state = LOTTERY_STATE.CALCULATING_WINNER;
    bytes32 requestId = requestRandomness(keyhash, fee);
    emit RequestedRandomness(requestId);
  }

  function fulfillRandomness(bytes32 _requestId, uint256 _randomness)
    internal
    override 
  {
    require(
      lottery_state == LOTTERY_STATE.CALCULATING_WINNER,
      "Not the right time for this!"
    );
    require(_randomness > 0, "random-not-found");
    // using modula will always provide results within the range [0, length -1]
    // so it's fair to say is a nice way to get a random index given max index will be also length -1
    uint256 indexOfWinner = _randomness % players.length;
    recentWinner = players[indexOfWinner];
    recentWinner.transfer(address(this).balance);
    // IMPORTANT: Dynamic memory arrays are created using new keyword.
    // https://www.tutorialspoint.com/solidity/solidity_arrays.htm
    // https://cryptomarketpool.com/how-to-create-an-array-in-a-solidity-smart-contract/
    players = new address payable[](0);
    lottery_state = LOTTERY_STATE.CLOSED;
    randomness = _randomness;
  }

}