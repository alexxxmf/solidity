from brownie import interface, config, network

from scripts.helpers import get_account


def get_weth():
  account = get_account()
  # Addr:  0xc778417E063141139Fce010982780140Aa0cD5Ab
  # ABI: WethInterface
  weth_contract = interface.WethInterface(config["networks"][network.show_active()]["weth_token"])
  tx = weth_contract.deposit({"from": account, "value": 0.1 * (10 ** 18)})
  tx.wait(1)
  print("ETH sent!")
  return tx

def main():
  get_weth()