from brownie import (
  accounts,
  network,
  config,
  LinkToken,
  VRFCoordinatorMock,
  Contract
)
from scripts.deploy_mocks import deploy_mocks

FORKED_LOCAL_ENVIRONMENTS = ["mainnet-fork", "mainnet-fork-dev"]
LOCAL_BLOCKCHAIN_ENVIRONMENTS = ["development", "ganache-local"]

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

def get_contract(contract_name):
  contract_type = contract_to_mock[contract_name]

  if network.show_active() in LOCAL_BLOCKCHAIN_ENVIRONMENTS:
    if len[contract_type] <= 0:
      deploy_mocks()
    
    contract = contract_type[-1]
  else:
    contract_address = config["networks"][network.show_active()][contract_name]
    contract = Contract.from_abi(
        contract_type._name, contract_address, contract_type.abi
    )
  return contract
