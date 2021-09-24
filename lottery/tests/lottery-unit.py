
from scripts.helpful_scripts import (
    get_account,
    fund_with_link,
    get_contract,
    deploy_lottery
)
from brownie import exceptions
from web3 import Web3
import pytest


def test_get_entrance_fee():
  lottery_contract = deploy_lottery()
  print(lottery_contract)
