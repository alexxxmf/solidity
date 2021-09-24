// SPDX-License-Identifier: MIT
pragma solidity ^0.6.6;

import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";


contract Lottery {
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
  
  constructor(address _priceFeedAddress, uint256 _usdEntryFee) public{
    ethUsdPriceFeed = AggregatorV3Interface(_priceFeedAddress);
    usdEntryFee = _usdEntryFee * (10 ** 18); // we pass it in usd then we convert to 18 decimals
  }

  function enter() public payable {
    require(lottery_state == LOTTERY_STATE.OPEN);
  }

  function getEntranceFee() public {
    (
      /*uint80 roundID*/,
      int price,
      /*uint startedAt*/,
      /*uint timeStamp*/,
      /*uint80 answeredInRound*/
    ) = ethUsdPriceFeed.latestRoundData();

    // 18 decimals, price comes with 8 decimals according to chainlink docs
    uint256 adjustedPrice = uint256(price) * 10**10;
    uint256 costToEnter = usdEntryFee/adjustedPrice;
  }

  function startLottery() public {
    require(
      lottery_state == LOTTERY_STATE.CLOSED,
      "Can't start a new lottery yet!"
    );
    lottery_state = LOTTERY_STATE.OPEN;
  }

}