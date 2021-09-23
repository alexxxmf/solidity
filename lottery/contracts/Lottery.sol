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
  
  constructor(address _priceFeedAddress) public{
    ethUsdPriceFeed = AggregatorV3Interface(_priceFeedAddress);
  }

  function enter() public payable {

  }

  function getEntranceFee() public {

  }

  function startLottery() public {

  }

}