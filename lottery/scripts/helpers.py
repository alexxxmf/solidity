from brownie import (
    accounts,
    network,
    config,
    MockV3Aggregator,
    VRFCoordinatorMock,
    LinkToken,
    Contract
)


FORKED_LOCAL_ENVIRONMENTS = ["mainnet-fork", "mainnet-fork-dev"]
LOCAL_BLOCKCHAIN_ENVIRONMENTS = ["development", "ganache-local"]
DECIMALS = 8
INITIAL_VALUE = 200000000000

contract_to_mock_map = {
    "eth_usd_price_feed": MockV3Aggregator,
    "vrf_coordinator": VRFCoordinatorMock,
    "link_token": LinkToken,
}

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

def get_contract(contract_name):
    """
    This function will grab the contract addresses from the brownie config
    if defined, otherwise, it will deploy a mock version of that contract, and
    return that mock contract.

        Args:
            contract_name (string)
        Returns:
            brownie.network.contract.ProjectContract: The most recently deployed
            version of this contract.
    """

    contract_mock = contract_to_mock_map[contract_name]

    if (
        network.show_active() in LOCAL_BLOCKCHAIN_ENVIRONMENTS
    ):
        if(len(contract_mock) <= 0):
            deploy_mocks()

        contract = contract_mock[-1]

    else:
        contract_addr = config["networks"][network.show_active()][contract_name]
        contract = Contract.from_abi(
            contract_mock._name, contract_addr, contract_addr.abi
        )

    return contract

def fund_with_link(
    contract_address, account=None, link_token=None, amount=100000000000000000 # 0.1 LINK
):
    account = account if account else get_account()
    link_token = link_token if link_token else get_contract("link_token")
    tx = link_token.transfer(contract_address, amount, {"from": account})
    tx.wait(1)

    print("Fund contract!")
    return tx

DECIMALS = 8
INITIAL_VALUE = 200000000000

def deploy_mocks(decimals=DECIMALS, initial_value=INITIAL_VALUE):
  account = get_account()

  MockV3Aggregator.deploy(decimals, initial_value, {"from": account})
  link_token = LinkToken.deploy({"from": account})
  VRFCoordinatorMock.deploy(link_token.address, {"from": account})

  print("Mocks for price feed, link token and VRF Coordinator have been successfully deployed")