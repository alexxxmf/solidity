from brownie import (
  accounts,
  config,
  interface,
  network,
  interface
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

def approve_erc20(amount, lending_pool_address, erc20_address, account):
  print("Approving ERC20...")
  erc20 = interface.ERC20(erc20_address)
  tx_hash = erc20.approve(lending_pool_address, amount, {"from": account})
  tx_hash.wait(1)
  print("Approved!")
  return True

def get_borrowable_data(lending_pool, account):
  (
    total_collateral_eth,
    total_debt_eth,
    available_borrow_eth,
    current_liquidation_threshold,
    tlv,
    health_factor
  ) = lending_pool.getUserAccountData(account.address)

  available_borrow_eth = Web3.fromWei(available_borrow_eth, "ether")
  total_collateral_eth = Web3.fromWei(total_collateral_eth, "ether")
  total_debt_eth = Web3.fromWei(total_debt_eth, "ether")
  print(f"You have {total_collateral_eth} worth of ETH deposited.")
  print(f"You have {total_debt_eth} worth of ETH borrowed.")
  print(f"You can borrow {available_borrow_eth} worth of ETH.")
  return (float(available_borrow_eth), float(total_debt_eth))

def get_asset_price():
  dai_eth_price_feed = interface.AggregatorV3Interface(
      config["networks"][network.show_active()]["dai_eth_price_feed"]
  )
  latest_price = Web3.fromWei(dai_eth_price_feed.latestRoundData()[1], "ether")
  print(f"The DAI/ETH price is {latest_price}")
  return float(latest_price)

def repay_all(amount, lending_pool, account):
  approve_erc20(
    Web3.toWei(amount, "ether"),
    lending_pool,
    config["networks"][network.show_active()]["aave_dai_token"],
    account,
  )
  tx = lending_pool.repay(
    config["networks"][network.show_active()]["aave_dai_token"],
    Web3.toWei(amount, "ether"),
    1,
    account.address,
    {"from": account},
  )
  tx.wait(1)
  print("Repaid!")

def borrow_erc20(lending_pool, amount, account, erc20_address=None):
  erc20_address = (
      erc20_address
      if erc20_address
      else config["networks"][network.show_active()]["aave_dai_token"]
  )
  # 1 is stable interest rate
  # 0 is the referral code
  transaction = lending_pool.borrow(
      erc20_address,
      Web3.toWei(amount, "ether"),
      1,
      0,
      account.address,
      {"from": account},
  )
  transaction.wait(1)
  print(f"Congratulations! We have just borrowed {amount}")

def main():
  account = get_account()
  erc20_address = config["networks"][network.show_active()]["weth_token"]

  if network.show_active() in ["mainnet-fork", "mainnet-fork-dev"]:
    get_weth(account=account)

  lending_pool = get_lending_pool()
  approve_erc20(amount, lending_pool.address, erc20_address, account)
  print("Depositing...")
  lending_pool.deposit(erc20_address, amount, account.address, 0, {"from": account})
  print("Deposited!")
  borrowable_eth, total_debt_eth = get_borrowable_data(lending_pool, account)

  erc20_eth_price = get_asset_price()
  amount_erc20_to_borrow = (1 / erc20_eth_price) * (borrowable_eth * 0.95)
  
  print(f"We are going to borrow {amount_erc20_to_borrow} DAI")
  borrow_erc20(lending_pool, amount_erc20_to_borrow, account)

  borrowable_eth, total_debt_eth = get_borrowable_data(lending_pool, account)

  repay_all(amount_erc20_to_borrow, lending_pool, account)

  get_borrowable_data(lending_pool, account)