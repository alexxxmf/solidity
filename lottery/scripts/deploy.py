from brownie import accounts, network, Lottery, config

from scripts.helpers import get_account, get_contract


ENTRANCE_FEE = 50

def deploy_lottery(entrance_fee=ENTRANCE_FEE):
  account = get_account()
  priceFeedAddress = get_contract("eth_usd_price_feed").address

  lottery_contract = Lottery.deploy(priceFeedAddress, entrance_fee, {"from": account});

  return lottery_contract

def main():
  deploy_lottery()