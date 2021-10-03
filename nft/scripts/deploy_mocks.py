from brownie import LinkToken, VRFCoordinatorMock
from scripts.helpers import get_account


def deploy_mocks():
  print("Deploying mocks...")
  account = get_account()
  link_token = LinkToken.deploy({"from": account})
  print(f'Link token mock deployed at {link_token.address}')
  vrf_coordinator = VRFCoordinatorMock.deploy(link_token.address, {"from": account})
  print(f'VRF coordinator mock deployed at {vrf_coordinator.address}')

def main():
  deploy_mocks()