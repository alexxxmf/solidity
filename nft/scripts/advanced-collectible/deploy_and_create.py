from brownie import accounts, AdvancedCollectible, network, config

from scripts.helpers import get_account, get_contract, fund_with_link


def deploy_and_create():
    account = get_account()
    advanced_collectible = AdvancedCollectible.deploy(
      "Pokemon",
      "PKMN",
      get_contract("vrf_coordinator"),
      get_contract("link_token"),
      config["networks"][network.show_active()]["key_hash"],
      config["networks"][network.show_active()]["fee"],
      {"from": account}
    )
    fund_with_link(advanced_collectible.address)
    tx = advanced_collectible.createCollectible({"from": account})
    tx.wait(1)
    return advanced_collectible, tx

def main():
  deploy_and_create()
