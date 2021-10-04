from brownie import (
  accounts,
  network,
  config,
  LinkToken,
  VRFCoordinatorMock,
  Contract
)
from web3 import Web3


FORKED_LOCAL_ENVIRONMENTS = ["mainnet-fork", "mainnet-fork-dev"]
LOCAL_BLOCKCHAIN_ENVIRONMENTS = ["development", "ganache-local"]
POKEMON_TYPE_MAPPING = {0: "", 1: "", 2: ""}

def get_pokemon_type(type_number):
  return POKEMON_TYPE_MAPPING[type_number]

def get_account(index=None, id=None):
    # accounts[0]
    # accounts.add("env")
    # accounts.load("id")
    if index:
        return accounts[index]
    if id:
        return accounts.load(id)
    if (
        network.show_active() in LOCAL_BLOCKCHAIN_ENVIRONMENTS
        or network.show_active() in FORKED_LOCAL_ENVIRONMENTS
    ):
        return accounts[0]
    return accounts.add(config["wallets"]["from_key"])

contract_to_mock = {
  "link_token": LinkToken,
  "vrf_coordinator": VRFCoordinatorMock
}

def deploy_mocks():
  print("Deploying mocks...")
  account = get_account()
  link_token = LinkToken.deploy({"from": account})
  print(f'Link token mock deployed at {link_token.address}')
  vrf_coordinator = VRFCoordinatorMock.deploy(link_token.address, {"from": account})
  print(f'VRF coordinator mock deployed at {vrf_coordinator.address}')

def get_contract(contract_name):
  contract_type = contract_to_mock[contract_name]

  if network.show_active() in LOCAL_BLOCKCHAIN_ENVIRONMENTS:
    if len(contract_type) <= 0:
      deploy_mocks()
    
    contract = contract_type[-1]
  else:
    contract_address = config["networks"][network.show_active()][contract_name]
    contract = Contract.from_abi(
        contract_type._name, contract_address, contract_type.abi
    )
  return contract

def fund_with_link(
    contract_address, account=None, link_token=None, amount=Web3.toWei(0.3, "ether")
):
  account = account if account else get_account()
  link_token = link_token if link_token else get_contract("link_token")
  funding_tx = link_token.transfer(contract_address, amount, {"from": account})
  funding_tx.wait(1)
  print(f"Funded {contract_address}")
  return funding_tx
