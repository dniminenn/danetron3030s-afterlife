async function fetchEntireCollection(_contractaddresses) {
  const collectionDiv = document.getElementById("collection");
  collectionDiv.innerHTML = ""; // Clear the collection div only once before the entire fetch

  for (let contractInfo of _contractaddresses) {
    const { chain, address } = contractInfo;

    // Add a chain header to the collectionDiv
    const chainHeader = document.createElement('h3');
    chainHeader.textContent = chain; // or whatever you want to name the chains
    collectionDiv.appendChild(chainHeader);

    // Create a separate div for this chain's collection and append it to the collectionDiv
    const chainDiv = document.createElement('div');
    chainDiv.id = `collection-${chain}`;  // unique ID based on chain
    collectionDiv.appendChild(chainDiv);

    const url = `https://backend.afterlife3030.io/${chain}/${address}/collection/`;
    const response = await fetch(url);
    const data = await response.json();
    appendCollection(data, address, chain);
  }
}

function appendCollection(data, _contractaddress, _chain) {
  const chainDiv = document.getElementById(`collection-${_chain}`);
  const collectionDiv = document.getElementById("collection");

  async function displayTokenDetails(
    tokenData,
    tokenId,
    _chain,
    _contractaddress
  ) {
    // Fetch owner data
    const ownersUrl = `https://backend.afterlife3030.io/${_chain}/${_contractaddress}/owners/${tokenId}`;
    const ownerResponse = await fetch(ownersUrl);
    const ownerData = await ownerResponse.json();

    // Process the owner data
    let ownerString;
    if (ownerData.length === 0) {
      ownerString = "No owners available.";
    } else if (ownerData.length === 1) {
      ownerString = `Owned by: ${ownerData[0]}`;
    } else {
      ownerString = `Owned by ${ownerData.length} addresses.`;
    }

    collectionDiv.innerHTML = "";

    const { name, description, attributes, rarity_score, rarity_index } = tokenData;
    let description2 = description.replace(/\n/g, "<br />");
    const imageUrl = `https://assets.afterlife3030.io/${_chain}/${_contractaddress}/${tokenId}.webp`;

    let attributesHtml = "";
    if (attributes && attributes.length) {
      attributesHtml += '<ul class="token-attributes">';
      for (let i = 0; i < attributes.length; i++) {
        attributesHtml += `<li><strong>${attributes[i].trait_type}</strong>: ${attributes[i].value}</li>`;
      }
      attributesHtml += "</ul>";
    }

    const rarityScoreDisplay = rarity_score === null ? "Rarity Score: Not available" : `Rarity Score: ${rarity_score}`;
    const rarityIndexDisplay = rarity_index === null ? "Rarity Index: Not available" : `Rarity Index: ${rarity_index}`;
    collectionDiv.innerHTML = `
    <div class="token-details">
        <h3>${name}</h3>
        <div class="token-content">
            <img id="tokenImage" src="${imageUrl}" alt="${name}">
            <div class="description-container">
                <p>${description2}</p>
                ${attributesHtml}
                <p>${rarityIndexDisplay}</p>
                <p>${rarityScoreDisplay}</p>
                <p>${ownerString}</p>
                <button id="returnToOverview">Return to Overview</button>
            </div>
        </div>
    </div>
    `;

    document
      .getElementById("returnToOverview")
      .addEventListener("click", () => {
        fetchEntireCollection(contractaddresses);
        document
          .getElementById("toggleCollectionButton")
          .scrollIntoView({ behavior: "smooth" });
      });

    document.getElementById("tokenImage").addEventListener("click", () => {
      fetchEntireCollection(contractaddresses);
      document
        .getElementById("toggleCollectionButton")
        .scrollIntoView({ behavior: "smooth" });
    });
  }

  if (Object.keys(data).length === 0) {
    const noTokensDiv = document.createElement("div");
    noTokensDiv.innerHTML = "";
    collectionDiv.appendChild(noTokensDiv);
    return;
  }

  lowercase_contractaddress = _contractaddress.toLowerCase();

  // If the collection is not empty, display the tokens
  for (const [tokenId, tokenData] of Object.entries(data)) {
    if (
      lowercase_contractaddress ==
        "0x35372b723340b3bb62d3ae4723ad743c298f4f8c" &&
      tokenId > 25
    ) {
      // Skip the token if it's not in the first 25
      continue;
    }

    const { name, rarity_index } = tokenData;
    const imageUrl = `https://assets.afterlife3030.io/${_chain}/${_contractaddress}/${tokenId}.webp`;
    const rarityidxpertoken = rarity_index === null ? "" : `<p>${rarity_index}<p>`;
    const tokenDiv = document.createElement("div");
    tokenDiv.className = "token";
    tokenDiv.innerHTML = `
            <h5>${name}</h5>
            <img src="${imageUrl}" alt="${name}">
            ${rarityidxpertoken}
        `;

    tokenDiv.addEventListener("click", () => {
      displayTokenDetails(tokenData, tokenId, _chain, _contractaddress);
      document
        .getElementById("toggleCollectionButton")
        .scrollIntoView({ behavior: "smooth" });
    });

    chainDiv.appendChild(tokenDiv);
  }
}

function toggleCollectionDisplay(show) {
  const collectionContainer = document.getElementById("collectionContainer");
  const showButton = document.getElementById("showCollectionButton");
  const hideButton = document.getElementById("hideCollectionButton");

  if (show) {
    collectionContainer.style.display = "block";
    showButton.style.display = "none";
    hideButton.style.display = "inline-block";
    fetchEntireCollection(contractaddresses);
    document
      .getElementById("toggleCollectionButton")
      .scrollIntoView({ behavior: "smooth" });
  } else {
    collectionContainer.style.display = "none";
    showButton.style.display = "inline-block";
    hideButton.style.display = "none";
  }
}

document.addEventListener("DOMContentLoaded", (event) => {
  const collectionButton = document.getElementById("toggleCollectionButton");
  const collectionContainer = document.getElementById("collectionContainer");

  collectionButton.addEventListener("click", function () {
    if (
      collectionContainer.style.display === "none" ||
      !collectionContainer.style.display
    ) {
      collectionContainer.style.display = "block";
      fetchEntireCollection(contractaddresses);
      collectionButton.textContent = "Hide Collection"; // Change button text
    } else {
      collectionContainer.style.display = "none";
      collectionButton.textContent = "Show All Items"; // Change button text
    }
  });
});
