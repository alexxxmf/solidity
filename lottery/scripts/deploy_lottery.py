from scripts.helpers import get_account, get_contract
from brownie import  network, Lottery, config
import time


ENTRANCE_FEE = 50

def deploy_lottery(entrance_fee=ENTRANCE_FEE):
  account = get_account()
  priceFeedAddress = get_contract("eth_usd_price_feed").address

  lottery_contract = Lottery.deploy(
    priceFeedAddress,
    entrance_fee,
    get_contract("vrf_coordinator").address,
    get_contract("link_token").address,
    config["networks"][network.show_active()]["fee"],
    config["networks"][network.show_active()]["keyhash"],
    {"from": account},
    publish_source=config["networks"][network.show_active()].get("verify", False),
  );

  return lottery_contract

def main():
  deploy_lottery()