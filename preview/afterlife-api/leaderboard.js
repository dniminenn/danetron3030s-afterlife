// import contract_to_name.js so we can use the address_to_name function
import { address_to_name } from "/afterlife-api/contract_to_name.js";

let signer;
let userAddress;
let active_username;

async function showError(message) {
  document.getElementById("statusbar").style.display = "block";
  document.getElementById("statusbar").style.color = "red";
  document.getElementById("statusbar").textContent = message;
}
async function hideError() {
  document.getElementById("statusbar").style.display = "none";
}
async function showSuccess(message) {
  document.getElementById("statusbar").style.display = "block";
  document.getElementById("statusbar").style.color = "green";
  document.getElementById("statusbar").textContent = message;
}

document.addEventListener("DOMContentLoaded", async () => {});

// Load the profile of the top person on the leaderboard initially
const loadProfile = async (username, level, points) => {
  const profileHoverContainer = document.getElementById(
    "profileHoverContainer"
  );
  const pfpResponse = await fetch(
    `https://backend.afterlife3030.io/get-pfp?username=${username}`
  );
  const pfpData = await pfpResponse.json();
  const pfpUrl = pfpData.pfp_url;

  const level_image = level_to_image(level);

  profileHoverContainer.innerHTML = `
  <img src="${pfpUrl}" alt="Profile Picture" style="width: 100%; margin-top: 3rem;">
  <div style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; width: 100%; padding: 1rem 0;">
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 48%; text-align: left; margin: 1rem;">
          <img src="${level_image}" style="height: 2.5rem; margin-bottom: 0.5rem; border: 0; cursor: default; background: none;">
          <strong>Level ${level}</strong>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 48%; text-align: right; margin: 1rem;">
          <img src="/afterlifepoints_insignia.webp" style="height: 2.5rem; margin-bottom: 0.5rem; border: 0; cursor: default; background: none;">
          <strong>${points}</strong>
      </div>
  </div>
`;
};

async function connectWallet() {
  hideError();
  if (window.ethereum) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);

    // Add event listeners immediately after detecting the provider
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("disconnect", handleDisconnect);

    try {
      await window.ethereum.enable();
      signer = provider.getSigner();
      userAddress = await signer.getAddress();
      let username = await fetchUsernameForAddress(userAddress);
      active_username = username;
      await updateUI(username);
    } catch (err) {
      console.error(err);
      showError("Please connect to Web 3 wallet.");
    }
  } else {
    console.error("No Ethereum provider found.");
    showError("Please install a Web3 wallet.");
  }
}

// Function to handle disconnection
function handleDisconnect() {
  active_username = null;
  console.log("MetaMask has disconnected");
  signer = null;
  updateUI(null);
}

// Function to handle account changes
async function handleAccountsChanged(accounts) {
  if (accounts.length === 0) {
    // MetaMask is locked or the user has not connected any accounts
    console.log("Please connect to MetaMask.");
    signer = null;
    userAddress = null;
    active_username = null;
    updateUI(null);
  } else if (accounts[0] !== userAddress.toLowerCase()) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    userAddress = await signer.getAddress();
    var username = await fetchUsernameForAddress(userAddress);
    active_username = username;
    updateUI(username);
  }
}

async function fetchUsernameForAddress(addr) {
  try {
    const response = await fetch(
      "https://backend.afterlife3030.io/get-username",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: addr }),
      }
    );
    const data = await response.json();

    if (data.username) {
      console.log("Username found:", data.username);
      return data.username;
    } else {
      console.log("No username found for address:", addr);
      return addr;
    }
  } catch (err) {
    console.error("Error fetching username:", err);
    return addr;
  }
}

async function updateUI(username) {
  const connectButton = document.getElementById("walletContainer");
  const afterlifecontainer = document.getElementById("afterlifecontainer");
  const welcomeMessage = document.getElementById("welcomeMessage");

  if (username) {
    console.log("Updating UI for user:", username);
    update_afterlife_header(username, active_username);
    welcomeMessage.style.display = "block";
    afterlifecontainer.style.display = "flex";
    await getMyProfile(username); // load my profile
    // click on the profile button
    //document.getElementById("viewProfile").click();
  } else {
    console.log("Resetting UI");
    welcomeMessage.style.display = "none";
    document.getElementById("myprofile").style.display = "none";
    document.getElementById("myprofileheader").style.display = "none";
    document.getElementById("leaderboardheader").style.display = "none";
    connectButton.innerHTML =
      '<button id="connectButton">Connect Wallet</button>';
    afterlifecontainer.style.display = "none";
  }
}

window.addEventListener("load", async (event) => {
  console.log("Page loading, connecting wallet...");
  await connectWallet(); // Check the connection status when the page loads
});

async function getLeaderboard() {
  hideError();
  console.log("Loading leaderboard");
  document.getElementById("walletContainer").innerHTML =
    '<button id="viewProfile">View My Profile</button>';
  document.getElementById("myprofile").style.display = "none";
  document.getElementById("myprofileheader").style.display = "none";
  document.getElementById("leaderboardheader").style.display = "block";
  document.getElementById("leaderboardContainer").style.display = "block";
  document.getElementById("profileHoverContainer").style.display = "flex";
  document.getElementById("profileHoverContainer").style.flexDirection =
    "column";
  document.getElementById("leaderboardContainer").innerHTML = "";
  update_afterlife_header(active_username, active_username);
  const leaderboardEndpoint =
    "https://assets.afterlife3030.io/leaderboard.json";
  const leaderboardContainer = document.getElementById("leaderboardContainer");
  leaderboardContainer.style.display = "block";

  try {
    const response = await fetch(leaderboardEndpoint);
    const data = await response.json();

    // Convert the data object into an array and sort it based on scores, but don't slice it
    let sortedData = Object.entries(data).sort((a, b) => b[1] - a[1]);

    // Finally, slice the array to only include the top 200 entries

    sortedData = sortedData.slice(0, 50);

    for (let [username, score] of sortedData) {
      const leaderboardItem = document.createElement("div");
      leaderboardItem.className = "leaderboardItem";

      // Fetch the profile picture for this user
      const pfpResponse = await fetch(
        `https://backend.afterlife3030.io/get-pfp?username=${username}`
      );
      const pfpData = await pfpResponse.json();
      const pfpUrl = pfpData.pfp_url;
      const level = points_to_level(score);
      const level_image = level_to_image(level);

      if (sortedData.length > 0) {
        loadProfile(
          sortedData[0][0],
          points_to_level(sortedData[0][1]),
          sortedData[0][1]
        );
      }

      leaderboardItem.innerHTML = `
                <div class="profileContainer">
                    <img src="${pfpUrl}" alt="Profile Picture" class="profilePicture">
                    <span class="username">${username}</span>
                </div>
                <div class="tooltip">
                <img src="${level_image}" alt="Profile Picture" class="profilePicture" style="border: none">
                <span class="tooltiptext">Level ${level}</span>
                </div>
            `;

      leaderboardItem.addEventListener("mouseenter", () => {
        loadProfile(username, level, score);
      });

      leaderboardItem.addEventListener("click", () => {
        getMyProfile(username);
      });

      leaderboardContainer.appendChild(leaderboardItem);
    }
    console.log("Finished loading leaderboard");
  } catch (error) {
    showError("Error fetching My Afterlife data.");
    console.error("Error fetching leaderboard data:", error);
  }
}

async function getMyProfile(usr) {
  hideError();
  console.log("Loading my profile");
  document.getElementById("walletContainer").innerHTML =
    '<button id="viewLeaderboard">View the Leaderboard</button>';
  document.getElementById("myprofile").style.display = "block";
  document.getElementById("myprofileheader").style.display = "block";
  document.getElementById("leaderboardheader").style.display = "none";
  document.getElementById("leaderboardContainer").style.display = "none";
  document.getElementById("profileHoverContainer").style.display = "none";

  update_afterlife_header(usr, active_username);

  let ranking = await get_user_rank(usr);

  const endpoint = `https://backend.afterlife3030.io/user/level/${usr}`;

  try {
    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();

    // the api returns an array of wallets addresses in the user's account
    // we'll need them later
    //const all_addresses = data.addresses;
    //const num_addresses = all_addresses.length;


    const profileContainer = document.getElementById("myprofile");
    const profileHeader = document.getElementById("myprofileheader");
    const level = points_to_level(data.afterlifepoints);
    const level_image = level_to_image(level);
    // Fetch the profile picture for this user
    const pfpResponse = await fetch(
      `https://backend.afterlife3030.io/get-pfp?username=${usr}`
    );
    const pfpData = await pfpResponse.json();
    const pfpUrl = pfpData.pfp_url;

    const numNFTs = data.top_nfts.length;

    let topNFTsHTML = `<h5>Top NFTs</h5><div class="chain-collection">`;
    if (numNFTs > 0) {
      for (let i = 0; i < Math.min(10, data.top_nfts.length); i++) {
        const nft = data.top_nfts[i];
        // viewer url is ./(address_to_name)?chain=chain&expandto=tokenid
        const collection_name = address_to_name(
          nft.chain,
          nft.contract_address
        );
        const view_url = `/${collection_name}?chain=${nft.chain}&expandto=${nft.token_id}`;
        topNFTsHTML += `
      <div class="token" id="token-${i}" data-view-url="${view_url}">
        <h5>${nft.token_name}</h5>
        <img style="margin: 0px;" src="https://assets.afterlife3030.io/${nft.chain}/${nft.contract_address}/${nft.token_id}.webp" alt="${nft.token_name}">
        <p class="afterlifepoints"><img src="/afterlifepoints_insignia.webp" style="width: 2rem; vertical-align: middle;margin-top: 0;border: 0;cursor: default; background: none; min-height: 0px;"><strong>${nft.rarity_score}</strong></p>
    </div>
    `;
      }
      topNFTsHTML += `</div></div>`;
      profileHeader.innerHTML = `<h5>${data.username}'s Profile</h5>`;
      // enable leaderboard button
      document.getElementById("viewLeaderboard").disabled = false;
    } else {
      // disable leaderboard button
      document.getElementById("viewLeaderboard").disabled = true;
      topNFTsHTML = `</div>`;
      // truncate address to 0x123...abc
      const addr_trunc = userAddress.slice(0, 6) + "..." + userAddress.slice(-3);
      // tell the user he needs to buy some Afterlife NFTs, be nice
      profileHeader.innerHTML = `<p>Oops, ${addr_trunc}, you need a Danetron3030 NFT to enter the Infinite Realms. <strong>If you've just registered a new username, it can take about 10 minutes for changes to propagate.</p>`;
    }

    let suffix = number_suffix(ranking);

    if (ranking == 0) {
      // infinity symbol
      suffix = "&#8734;";
    }

    profileContainer.innerHTML = `
    <div class="token-details"><div class="token-content">
    <a href="${pfpUrl}"  target="_blank" rel="noopener noreferrer"><img id="tokenImage" src="${pfpUrl}" alt="PFP"></a>
    <div class="description-container">
        <div style="text-align: center;"><img src="${level_image}" style="vertical-align: middle;margin-top: 0;border: 0;cursor: default; background: none; border-bottom: 10px double #fd0d98;padding-bottom: 20px;"></div>
        <h2 style="text-align: center;">Level ${level}</h5>
        <div style="text-align: center;"><img src="/afterlifepoints_insignia.webp" style="width: 3rem; vertical-align: middle;margin-top: 0;border: 0;cursor: default; background: none;"><strong>${data.afterlifepoints}</strong> Afterlife Points</div>
        <h5 style="text-align: center;"><span style="font-size: 1.7rem;">${suffix} place</span> on the leaderboard</h5>
    </div>
    </div>
        ${topNFTsHTML}
      `;

    // Add event listeners to the tokens
    for (let i = 0; i < Math.min(10, data.top_nfts.length); i++) {
      const tokenElement = document.getElementById(`token-${i}`);
      if (tokenElement) {
        tokenElement.addEventListener("click", function () {
          window.open(
            window.location.origin + this.getAttribute("data-view-url"),
            "_blank"
          );
        });
      }
    }
  } catch (error) {
    console.error("Error fetching My Profile data:", error);
    showError("Error fetching My Profile data.");
  }
}

function points_to_level(points) {
  // score = 0, level = 0
  // score = 1 - 999, level = 1
  // score = 1000 - 1999, level = 2
  if (points == 0) {
    return 0;
  } else {
    return Math.floor(points / 1000) + 1;
  }
}

function level_to_image(level) {
  if (level == 0) {
    return "https://assets.afterlife3030.io/deadghostie.webp";
  } else {
    return `https://assets.afterlife3030.io/afterlife-levels/${level}.webp`;
  }
}

// The central event listener for the walletContainer
document
  .getElementById("walletContainer")
  .addEventListener("click", async (event) => {
    if (event.target.id === "viewProfile") {
      console.log("Switching to profile");
      await getMyProfile(active_username);
    } else if (event.target.id === "viewLeaderboard") {
      console.log("Switching to leaderboard");
      await getLeaderboard();
    } else if (event.target.id === "connectButton") {
      await connectWallet();
    }
  });

// change 1, 2, 3, etc.. to 1st, 2nd, 3rd, etc...
// mind 11th, 12th, 13th
// then 21st, 22nd, 23rd
function number_suffix(number) {
  let suffix = "th";
  if (number % 10 == 1) {
    suffix = "st";
  } else if (number % 10 == 2) {
    suffix = "nd";
  } else if (number % 10 == 3) {
    suffix = "rd";
  }
  if (number % 100 == 11 || number % 100 == 12 || number % 100 == 13) {
    suffix = "th";
  }
  return number + suffix;
  // the above is a bit of a hack, but it works
}

function update_afterlife_header(display_username, calling_user) {
  console.log("display_username:", display_username);
  console.log("calling_user:", calling_user);
  const welcomeMessage = document.getElementById("welcomeMessage");
  if (display_username == calling_user) {
    welcomeMessage.innerHTML = `<p class="embellish">Welcome to your Afterlife, <em><a href="/my-account">${display_username}</a></em>! The Infinite Realms await you.</p>`;
  } else {
    // change to Welcome, (your username), you are traversing the Infinite Realms and are viewing another Afterlifer's Profile
    welcomeMessage.innerHTML = `<p class="embellish">Welcome, <em><a href="/my-account">${calling_user}</a></em>! You are traversing the Infinite Realms and are viewing another Afterlifer's profile.</p>`;
  }
}

async function get_user_rank(usr) {
  const leaderboardEndpoint = "https://assets.afterlife3030.io/leaderboard.json";

  try {
    const response = await fetch(leaderboardEndpoint);
    const data = await response.json();

    let userRanking = 0;

    // Convert the data object into an array and sort it based on scores, but don't slice it
    let sortedData = Object.entries(data).sort((a, b) => b[1] - a[1]);

    // Is the user in the leaderboard?
    let userInLeaderboard = sortedData.find((entry) => entry[0] === usr);

    // Calculate the user's ranking
    if (userInLeaderboard) {
      userRanking = sortedData.findIndex((entry) => entry[0] === usr) + 1;
    }

    return userRanking;
  } catch (error) {
    showError("Error fetching My Afterlife data.");
    console.error("Error fetching leaderboard data:", error);
  }
}