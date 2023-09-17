async function fetchEntireCollection(_contractaddresses) {
  const collectionDiv = document.getElementById("collection");
  collectionDiv.innerHTML = ""; // Clear the collection div only once before the entire fetch

  for (let contractInfo of _contractaddresses) {
    const { chain, address } = contractInfo;
    const url = `https://backend.afterlife3030.io/${chain}/${address}/collection/`;
    const response = await fetch(url);
    const data = await response.json();
    appendCollection(data, address, chain);
  }
}

function appendCollection(data, _contractaddress, _chain) {
  const collectionDiv = document.getElementById("collection");

  async function displayTokenDetails(
    tokenData,
    tokenId,
    _chain,
    _contractaddress
  ) {
    // Fetch owner data
    const ownersUrl = `https://e4res7yu84h5hxzi5km.dnim.dev/${_chain}/${_contractaddress}/owners/${tokenId}`;
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

    const { name, description, attributes } = tokenData;
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

    collectionDiv.innerHTML = `
    <div class="token-details">
        <h3>${name}</h3>
        <div class="token-content">
            <img id="tokenImage" src="${imageUrl}" alt="${name}">
            <div class="description-container">
                <p>${description2}</p>
                ${attributesHtml}
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
    noTokensDiv.innerHTML = "<p>No tokens in the collection.</p>";
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

    const { name } = tokenData;
    const imageUrl = `https://assets.afterlife3030.io/${_chain}/${_contractaddress}/${tokenId}.webp`;
    const tokenDiv = document.createElement("div");
    tokenDiv.className = "token";
    tokenDiv.innerHTML = `
            <h5>${name}</h5>
            <img src="${imageUrl}" alt="${name}">
        `;

    tokenDiv.addEventListener("click", () => {
      displayTokenDetails(tokenData, tokenId, _chain, _contractaddress);
      document
        .getElementById("toggleCollectionButton")
        .scrollIntoView({ behavior: "smooth" });
    });

    collectionDiv.appendChild(tokenDiv);
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
