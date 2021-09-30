from brownie import (
  accounts,
  config,
  interface,
  network,
  interface,
)
from web3 import Web3

from scripts.get_weth import get_weth
from scripts.helpers import get_account


amount = Web3.toWei(0.1, "ether")

def get_lending_pool():
  lending_pool_addresses_provider = interface.ILendingPoolAddressesProvider(
    config["networks"][network.show_active()]["lending_pool_addresses_provider"]
  )
  lending_pool_address = lending_pool_addresses_provider.getLendingPool()
  lending_pool = interface.ILendingPool(lending_pool_address)
  return lending_pool

def main():
  lending_pool = get_lending_pool()
  print(lending_pool)