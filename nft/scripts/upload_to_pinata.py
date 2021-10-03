import requests, os
from pathlib import Path


pinata_base_url = os.getenv("PINATA_BASE_URL")
endpoint = "pinning/pinFileToIPFS"
filepath = "../assets/to-be-uploaded/charmander.png"
filename = filepath.split("/")[-1:][0]

def main():
  with Path(filepath).open("rb") as fp:
    image_binary = fp.read()
    response = requests.post(
      pinata_base_url + endpoint,
      files={"file": (filename, image_binary)},
      headers={
        "pinata_api_key": os.getenv("PINATA_API_KEY"),
        "pinata_secret_api_key": os.getenv("PINATA_API_SECRET")
      }
    )
    print(response.json())

if __name__ == "__main__":
    main()