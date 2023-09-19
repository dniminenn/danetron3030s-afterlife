import { erc721_abi } from "/afterlife-api/erc721.abi.js";

let userAddress = null;
let signer = null;
let isSwitchingNetworks = false;

// Function to handle account changes
async function handleAccountsChanged(accounts) {
  if (accounts.length === 0) {
    // MetaMask is locked or the user has not connected any accounts
    console.log("Please connect to MetaMask.");
    signer = null;
    updateUI(null);
    clearCollection();
  } else if (accounts[0] !== userAddress.toLowerCase()) {
    // Do something with accounts[0], which is the currently connected account
    userAddress = accounts[0];
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    updateUI(userAddress);
    fetchCollection(userAddress, contractaddress);
  }
}

// Function to handle chain changes
async function handleChainChanged(_chainId) {
  const chainId = parseInt(_chainId, 1); // Convert to decimal as your code uses decimal chain IDs
  if (chainId !== 1) {
    updateUI(null, "Please switch to the Ethereum network.");
    clearCollection();
  } else {
    // You can add logic here to handle the new chain
    // For example, you might want to reload the collection
    updateUI(userAddress);
    fetchCollection(userAddress, contractaddress);
  }
}

// Function to handle disconnection
function handleDisconnect() {
  // If the disconnection is due to a network switch, do nothing
  if (isSwitchingNetworks) {
    connectWallet();
    return;
  }

  console.log("MetaMask has disconnected");
  signer = null;
  updateUI(null);
  clearCollection();
}

async function connectWallet() {
  if (window.ethereum) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);

    // Add event listeners immediately after detecting the provider
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
    window.ethereum.on("disconnect", handleDisconnect);
    
    try {
      await window.ethereum.enable();
      const network = await provider.getNetwork();
      if (network.chainId !== 1) {
        updateUI(null, "Please switch to the Ethereum network.");
        return;
      }
      signer = provider.getSigner();
      userAddress = await signer.getAddress();
      updateUI(userAddress);
      fetchCollection(userAddress, contractaddress);
    } catch (err) {
      console.error("User denied access to their Ethereum account.");
    }
  } else {
    console.error("No Ethereum provider found.");
  }
}

async function fetchCollection(address, _contractaddress) {
  const url = `https://backend.afterlife3030.io/Ethereum/${_contractaddress}/collection/${address}`;
  const response = await fetch(url);
  const data = await response.json();
  if (data.tokens) { displayCollection(data.tokens, _contractaddress);}
  else { displayCollection(data, _contractaddress); }
}

function clearCollection() {
  const collectionDiv = document.getElementById("collection");
  collectionDiv.innerHTML = "";
}

function displayCollection(data, _contractaddress) {
  const collectionDiv = document.getElementById("collection");

  // Function to display token details
  function displayTokenDetails(tokenData, tokenId) {
    const { name, description, attributes, rarity_score } = tokenData;
    const rarityScoreDisplay = rarity_score === null ? "Afterlife Points: Not available" : `Afterlife Points: ${rarity_score}`;
    let description2 = description.replace(/\n/g, "<br />");
    const imageUrl = `https://assets.afterlife3030.io/Ethereum/${_contractaddress}/${tokenId}.webp`;
    
    // Construct the attributes HTML
    let attributesHtml = "";
    if (attributes && attributes.length) {
      attributesHtml += '<ul class="token-attributes">';
      for (let i = 0; i < attributes.length; i++) {
        attributesHtml += `<li><strong>${attributes[i].trait_type}</strong>: ${attributes[i].value}</li>`;
      }
      attributesHtml += '</ul>';
    }
  
    collectionDiv.innerHTML = `
      <div class="token-details">
        <h3>${name}</h3>
        <div class="token-content">
        <a href="${imageUrl}"  target="_blank" rel="noopener noreferrer"><img id="tokenImage" src="${imageUrl}" alt="${name}"></a>
          <div class="description-container">
            <p>${description2}</p>
            ${attributesHtml}
            <p>${rarityScoreDisplay}</p>
            <div class="token-actions">
              <button id="transferButton">Transfer</button>
              <button id="burnButton">Burn</button>
              <button id="returnToOverview">Return to Overview</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add event listeners for the buttons
    document.getElementById("transferButton").addEventListener("click", () => {
      transferToken(tokenId);
    });
    document.getElementById("burnButton").addEventListener("click", () => {
      burnToken(tokenId);
    });
    document
      .getElementById("returnToOverview")
      .addEventListener("click", () => {
        displayCollection(data, _contractaddress); // Re-display the collection overview
        document.getElementById("collection").scrollIntoView({ behavior: 'smooth' });
      });
    // Add event listener for the image
    //document.getElementById("tokenImage").addEventListener("click", () => {
    //  displayCollection(data, _contractaddress); // Re-display the collection overview when image is clicked
    //  document.getElementById("collection").scrollIntoView({ behavior: 'smooth' });
    //});
  }

  // Check if the collection is empty
  if (Object.keys(data).length === 0) {
    collectionDiv.innerHTML = "<p>You don't own any tokens.</p>";
    return;
  }

  // Clear the collectionDiv for new data
  collectionDiv.innerHTML = "";

  // Sort the tokens by rarity score
  const sortedTokensArray = Object.entries(data).sort((a, b) => {
    const tokenA = a[1]; // Token data is the second item in the pair [tokenId, tokenData]
    const tokenB = b[1];
  
    // Sort in descending order by rarity_score. If rarity_score is null, treat it as -Infinity.
    return (tokenB.rarity_score || -Infinity) - (tokenA.rarity_score || -Infinity);
  });


  // If the collection is not empty, display the tokens
  for (const [tokenId, tokenData] of sortedTokensArray) {
    const { balance, name } = tokenData;
    const imageUrl = `https://assets.afterlife3030.io/Ethereum/${_contractaddress}/${tokenId}.webp`;
    const tokenDiv = document.createElement("div");
    tokenDiv.className = "token";
    tokenDiv.innerHTML = `
      <h5>${name}</h5>
      <img src="${imageUrl}" alt="${name}">
    `;
    tokenDiv.addEventListener("click", () => {
      displayTokenDetails(tokenData, tokenId); // Display details when clicked
      document.getElementById("collection").scrollIntoView({ behavior: 'smooth' });
    });
    collectionDiv.appendChild(tokenDiv);
  }
}

async function transferToken(tokenId) {
  const toAddress = prompt("Enter the recipient's address:");
  if (!toAddress || !ethers.utils.isAddress(toAddress)) {
    alert("Invalid recipient address.");
    return;
  }
  const contract = new ethers.Contract(contractaddress, erc721_abi, signer);

  try {
    const tx = await contract["safeTransferFrom(address,address,uint256)"](
      userAddress,
      toAddress,
      tokenId
    );
    await tx.wait();
    alert("Transfer successful!" + "\n" + "Tx Hash: " + tx.hash);
  } catch (err) {
    console.error("Transfer failed:", err);
  }
}

async function burnToken(tokenId) {
  const deadAddress = "0x000000000000000000000000000000000000dead";
  const contract = new ethers.Contract(contractaddress, erc721_abi, signer);

  try {
    const tx = await contract["safeTransferFrom(address,address,uint256)"](
      userAddress,
      deadAddress,
      tokenId
    );
    await tx.wait();
    alert("Burn successful!");
  } catch (err) {
    console.error("Burn failed:", err);
  }
}

// When the page loads
function updateUI(address, message = null) {
  if (address) {
    document.getElementById(
      "walletContainer"
    ).innerHTML = `<p>Connected: ${address}</p>`;
  } else {
    if (message) {
      document.getElementById("walletContainer").innerHTML = `
        <p>${message}</p>
        <button id="switchNetworkButton">Switch to Ethereum</button>
      `;
    } else {
      document.getElementById("walletContainer").innerHTML =
        '<button id="connectButton">Connect Wallet</button>';
    }
    document
      .getElementById("connectButton")
      ?.addEventListener("click", connectWallet);
    document
      .getElementById("switchNetworkButton")
      ?.addEventListener("click", switchToEthereum);
  }
}

window.addEventListener("load", async (event) => {
  await connectWallet(); // Check the connection status when the page loads
});

async function switchToEthereum() {
  isSwitchingNetworks = true; // Set the flag
  try {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: "0x1", // Chain ID for Ethereum is 0x1 in hexadecimal
          chainName: "Ethereum Mainnet",
          nativeCurrency: {
            name: "ETH",
            symbol: "ETH",
            decimals: 18,
          },
          rpcUrls: ["https://eth.llamarpc.com"],
          blockExplorerUrls: ["https://etherscan.com/"],
        },
      ],
    });
  } catch (error) {
    console.error("User rejected the request:", error);
  } finally {
    isSwitchingNetworks = false; // Reset the flag in the end
  }
}

document
  .getElementById("connectButton")
  .addEventListener("click", connectWallet);
