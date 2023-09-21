async function fetchEntireCollection(_contractaddresses) {
  const collectionDiv = document.getElementById("collection");
  collectionDiv.style.display = "block"; // override from flex to block
  collectionDiv.innerHTML = ""; // Clear the collection div only once before the entire fetch

  for (let contractInfo of _contractaddresses) {
    const { chain, address } = contractInfo;

    // Add a chain header to the collectionDiv
    const chainHeader = document.createElement('h3');
    chainHeader.textContent = chain;
    chainHeader.className = 'chain-header'; // class name for styling and indicator

    // Create a separate div for this chain's collection and append it to the collectionDiv
    const chainDiv = document.createElement('div');
    chainDiv.id = `collection-${chain}`;  // unique ID based on chain
    chainDiv.className = 'chain-collection'; // class name for styling

    // initially hide the chainDiv if there's more than one contract
    if (_contractaddresses.length > 1) {
        chainDiv.style.display = 'none';
    }

    // Add click event listener to toggle chainDiv visibility
    chainHeader.addEventListener('click', function() {
        if (chainDiv.style.display === 'none' || !chainDiv.style.display) {
            chainDiv.style.display = 'flex';
            // Optionally change the visual indicator, e.g., arrow direction
            chainHeader.classList.add('expanded');
        } else {
            chainDiv.style.display = 'none';
            chainHeader.classList.remove('expanded');
        }
    });

    collectionDiv.appendChild(chainHeader);
    collectionDiv.appendChild(chainDiv);

    const url = `https://backend.afterlife3030.io/${chain}/${address}/collection/`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.tokens) {    appendCollection(data.tokens, address, chain); }
    else { appendCollection(data, address, chain); }
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

    const { name, description, attributes, rarity_score } = tokenData;
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

    const rarityScoreDisplay = rarity_score === null ? "Afterlife Points: Not available" : `Afterlife Points: ${rarity_score}`;
    collectionDiv.innerHTML = `
    <div class="token-details">
        <h3>${name}</h3>
        <div class="token-content">
            <a href="${imageUrl}"  target="_blank" rel="noopener noreferrer"><img id="tokenImage" src="${imageUrl}" alt="${name}"></a>
            <div class="description-container">
                <p>${description2}</p>
                ${attributesHtml}
                <p><img src="/afterlifepoints_insignia.webp" style="width: 3rem; vertical-align: middle;margin-top: 0;border: 0;cursor: default; background: none;">${rarityScoreDisplay}</p>
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

    //document.getElementById("tokenImage").addEventListener("click", () => {
    //  fetchEntireCollection(contractaddresses);
    //  document
    //    .getElementById("toggleCollectionButton")
    //    .scrollIntoView({ behavior: "smooth" });
    //});
  }

  if (Object.keys(data).length === 0) {
    const noTokensDiv = document.createElement("div");
    noTokensDiv.innerHTML = "";
    collectionDiv.appendChild(noTokensDiv);
    return;
  }

  lowercase_contractaddress = _contractaddress.toLowerCase();

  // Sort the tokens by rarity score
  const sortedTokensArray = Object.entries(data).sort((a, b) => {
    const tokenA = a[1]; // Token data is the second item in the pair [tokenId, tokenData]
    const tokenB = b[1];
  
    // Sort in descending order by rarity_score. If rarity_score is null, treat it as -Infinity.
    return (tokenB.rarity_score || -Infinity) - (tokenA.rarity_score || -Infinity);
  });


  // If the collection is not empty, display the tokens
  for (const [tokenId, tokenData] of sortedTokensArray) {
    if (
      lowercase_contractaddress ==
        "0x35372b723340b3bb62d3ae4723ad743c298f4f8c" &&
      tokenId > 25
    ) {
      // Skip the token if it's not in the first 25
      continue;
    }

    const { name, rarity_score } = tokenData;
    const imageUrl = `https://assets.afterlife3030.io/${_chain}/${_contractaddress}/${tokenId}.webp`;
    const afterlifepoints = rarity_score === null ? "" : `<p class="afterlifepoints">${rarity_score} Afterlife Points<p>`;
    const tokenDiv = document.createElement("div");
    tokenDiv.className = "token";
    tokenDiv.innerHTML = `
            <h5>${name}</h5>
            <img src="${imageUrl}" alt="${name}">
            ${afterlifepoints}
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
