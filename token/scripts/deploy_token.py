from brownie import config, FancyToken

from scripts.helpers import get_account


def deploy_token():
  account = get_account()
  token_contract = FancyToken.deploy(100000000000000000000000000000000000, {"from": account})
  print("==================================")
  print(token_contract)
  print("==================================")

def main():
  deploy_token()