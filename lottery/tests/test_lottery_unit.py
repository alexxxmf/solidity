from scripts.helpers import (
    get_account,
    get_contract,
    fund_with_link
)
from scripts.deploy_lottery import deploy_lottery
from brownie import exceptions, network
from web3 import Web3
import pytest


def test_get_entrance_fee(check_local_blockchain_envs, lottery_contract):
  entrance_fee = lottery_contract.getEntranceFee()
  # INITIAL_VALUE sets eth price in usd to 2000 usd
  # ENTRANCE_FEE is 50 so 50/2000 is 0.025
  # 1 ether ==> 2000usd; 0.025ether ==> 50usd
  expected_entrance_fee = Web3.toWei(0.025, "ether")

  assert entrance_fee == expected_entrance_fee

def test_cant_enter_unless_started(check_local_blockchain_envs, lottery_contract):
  account = get_account()
  with pytest.raises(exceptions.VirtualMachineError):
    lottery_contract.enter(
      {"from": account, "value": lottery_contract.getEntranceFee()}
    )

def test_can_start_and_enter(check_local_blockchain_envs, lottery_contract):
  account = get_account()
  lottery_contract.startLottery({"from": account})

  lottery_contract.enter(
    {"from": account, "value": lottery_contract.getEntranceFee()}
  )

  assert lottery_contract.players(0) == account
  
  fund_with_link(lottery_contract)
  starting_balance_of_account = account.balance()
  balance_of_lottery = lottery_contract.balance()
  transaction = lottery_contract.endLottery({"from": account})
  request_id = transaction.events["RequestedRandomness"]["requestId"]
  static_rng = 777
  get_contract("vrf_coordinator").callBackWithRandomness(
    request_id, static_rng, lottery_contract.address, {"from": account}
  )

  assert lottery_contract.recentWinner() == account
  assert lottery_contract.balance() == 0
  assert account.balance() == starting_balance_of_account + balance_of_lottery