from brownie import interface, config, network, accounts

from scripts.helpers import get_account


def get_weth(account=None):
  account = (
      account if account else accounts.add(config["wallets"]["from_key"])
  )  # add your keystore ID as an argument to this call
  weth = interface.WethInterface(
      config["networks"][network.show_active()]["weth_token"]
  )
  tx = weth.deposit({"from": account, "value": 0.1 * 1e18})
  tx.wait(1)
  print("Received 0.1 WETH")
  return tx

def main():
  get_weth()