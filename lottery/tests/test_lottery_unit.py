from scripts.helpers import (
    get_account,
    get_contract
)
from scripts.deploy import deploy_lottery, ENTRANCE_FEE
from brownie import exceptions, network
from web3 import Web3
import pytest


def test_get_entrance_fee():
  lottery_contract = deploy_lottery()
  entrance_fee = lottery_contract.getEntranceFee()
  # INITIAL_VALUE sets eth price in usd to 2000 usd
  # ENTRANCE_FEE is 50 so 50/2000 is 0.025
  # 1 ether ==> 2000usd; 0.025ether ==> 50usd
  expected_entrance_fee = Web3.toWei(0.025, "ether")

  assert entrance_fee == expected_entrance_fee

