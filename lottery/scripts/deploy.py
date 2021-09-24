from brownie import accounts, network, Lottery, config

from scripts.helpers import get_account


def deploy_lottery():
  account = get_account()
  priceFeedAddress = config["networks"][network.show_active()]["eth_usd_price_feed"]
  lottery_contract = Lottery.deploy(priceFeedAddress, 50, {"from": account});

  return lottery_contract

def main():
  deploy_lottery()