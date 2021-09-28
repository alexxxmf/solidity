from brownie import LinkToken, MockV3Aggregator, VRFCoordinatorMock

from scripts.helpers import get_account


DECIMALS = 8
INITIAL_VALUE = 200000000000

def deploy_mocks(decimals=DECIMALS, initial_value=INITIAL_VALUE):
  account = get_account()

  MockV3Aggregator.deploy(decimals, initial_value, {"from": account})
  link_token = LinkToken.deploy({"from": account})
  VRFCoordinatorMock.deploy(link_token.address, {"from": account})

  print("Mocks for price feed, link token and VRF Coordinator have been successfully deployed")

def main():
  deploy_mocks()
