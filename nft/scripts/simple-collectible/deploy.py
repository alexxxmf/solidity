from brownie import accounts, SimpleCollectible

from scripts.helpers import get_account


TEST_URI = "https://ipfs.io/ipfs/Qmd9MCGtdVz2miNumBHDbvj8bigSgTwnr4SbyH6DNnpWdt?filename=0-PUG.json"
OPENSEA_URL = "https://testnets.opensea.io/assets/{}/{}"

def deploy_and_create():
    account = get_account()
    simple_collectible = SimpleCollectible.deploy("Dog", "DGG", {"from": account})
    tx = simple_collectible.createCollectible(TEST_URI, {"from": account})
    tx.wait(1)
    print(
        f"Awesome, you can view your NFT at {OPENSEA_URL.format(simple_collectible.address, simple_collectible.tokenCounter() - 1)}"
    )
    print("Please wait up to 20 minutes, and hit the refresh metadata button. ")
    return simple_collectible

def main():
  deploy_and_create()