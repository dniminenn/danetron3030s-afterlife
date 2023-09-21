const provider = new ethers.providers.Web3Provider(window.ethereum);
let signer = provider.getSigner();
let address;
let hasSignedWithFirstAddress = false;

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

async function initializePageState() {
    hideError();
    try {
        address = await signer.getAddress();
        
        if (!address) {
            // No account is connected
            document.getElementById("walletContainer").style.display = "block";
            document.getElementById("registration-container").style.display = "none";
            console.log("No account connected");
        } else {
            document.getElementById("account-container").textContent = `Connected: ${address}`;
            document.getElementById("walletContainer").style.display = "none";
            document.getElementById("registration-container").style.display = "block";
            console.log("Account connected:", address);
            
            // Check if the address is associated with a username
            await fetchUsernameForAddress(address);
        }
    } catch (err) {
        console.error("Error initializing page state:", err);
        showError("Error initializing page state. Please refresh the page and try again.")
    }
}


async function fetchUsernameForAddress(addr) {
    console.log("Fetching username for address:", addr);
    try {
        const response = await fetch('https://backend.afterlife3030.io/get-username', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: addr })
        });
        const data = await response.json();

        if (data.username) {
            document.getElementById("displayUsername").textContent = data.username;
            document.getElementById("username").value = data.username;
            document.getElementById("username").readOnly = true;
            document.getElementById("registration-container").style.display = "none";
            document.getElementById("existingUserContainer").style.display = "block";
            // Fetch the addresses for this username
            await fetchAddressesForUsername(data.username);
            console.log("Username found:", data.username);
        } else {
            document.getElementById("username").readOnly = false;
            document.getElementById("registerButton").style.display = "block";
            document.getElementById("registration-container").style.display = "block";
            document.getElementById("existingUserContainer").style.display = "none";
            console.log("No username found");
        }

    } catch (err) {
        console.error("Error fetching username:", err);
        showError("Error fetching username. Please refresh the page and try again.")
    }
}

document.getElementById("connectButton").addEventListener("click", async () => {
    hideError();
    try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        address = await signer.getAddress();
        document.getElementById("account-container").textContent = `Connected: ${address}`;
        document.getElementById("walletContainer").style.display = "none";
        document.getElementById("registration-container").style.display = "block";

        // Check if the address is associated with a username
        await fetchUsernameForAddress(address);

    } catch (err) {
        console.error("Failed to connect to the wallet", err);
        showError("Failed to connect to the wallet. Please refresh the page and try again.")
    }
});

document.getElementById("registerButton").addEventListener("click", async () => {
    hideError();
    const username = document.getElementById("username").value;

    if (!username) {
        alert("Please enter a username");
        showError("Please enter a username");
        return;
    }

    try {
        const response = await fetch(`https://backend.afterlife3030.io/get-challenge-new-user?username=${encodeURIComponent(username)}`);

        const data = await response.json();
        const challenge = data.challenge;

        const signedMessage = await signer.signMessage(challenge);

        const registrationResponse = await fetch('https://backend.afterlife3030.io/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: username,
                address: address,
                signedMessage: signedMessage
            })
        });
        const registrationData = await registrationResponse.json();

        if (registrationData.message) {
            showSuccess("Registration successful!")
            document.getElementById("registration-container").style.display = "none";
            document.getElementById("displayUsername").textContent = username;
            document.getElementById("existingUserContainer").style.display = "block"; // Show the option to add another address
        } else {
            showError(`Error: ${registrationData.error}`);
        }

    } catch (err) {
        console.error("Error registering username:", err);
        showError(`Error registering username.`);
    }
});

document.getElementById("signWithCurrentAddressButton").addEventListener("click", async () => {
    hideError();
    const username = document.getElementById("displayUsername").textContent;
    try {
        // First, get challenges for the existing user
        const response = await fetch(`https://backend.afterlife3030.io/get-challenge-existing-user?username=${encodeURIComponent(username)}`);
        const data = await response.json();

        // Sign the challenge for the existing address to prove ownership
        const signedMessageExisting = await signer.signMessage(data.challenge_existing);

        // Store the signed message and challenge for the new address in the window object temporarily
        window.signedMessageExisting = signedMessageExisting;
        window.challengeNew = data.challenge_new;

        // Disable the button
        document.getElementById("signWithCurrentAddressButton").disabled = true;
        // Change the button text
        document.getElementById("signWithCurrentAddressButton").textContent = "Signed!";
        // Show the next step
        hasSignedWithFirstAddress = true;
        document.getElementById("switchAndSignContainer").style.display = "block";
    } catch (err) {
        console.error("Error signing with existing address:", err);
        showError(`Error signing with existing address.`)
    }
});

document.getElementById("signWithNewAddressButton").addEventListener("click", async () => {
    hideError();
    const username = document.getElementById("displayUsername").textContent;
    console.log("Signing with new address for user:", username);

    try {
        // Ensure the address has switched
        const newAddress = await signer.getAddress();
        if (newAddress === address) {
            alert("You have not switched your address in Metamask. Please switch and try again.");
            return;
        }

        // Sign a message with the new address
        const signedMessageNew = await signer.signMessage(window.challengeNew);

        const registrationResponse = await fetch('https://backend.afterlife3030.io/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: username,
                newAddress: newAddress,
                existingAddress: address,
                signedMessageNew: signedMessageNew,
                signedMessageExisting: window.signedMessageExisting
            })
        });

        const registrationData = await registrationResponse.json();

        if (registrationData.message) {
            showSuccess("Registration successful!")
            // Disable the button
            document.getElementById("signWithNewAddressButton").disabled = true;
            // Change the button text
            document.getElementById("signWithNewAddressButton").textContent = "Signed!";
            document.getElementById("registration-container").style.display = "none";
            document.getElementById("existingUserContainer").style.display = "none";
            document.getElementById("switchAndSignContainer").style.display = "none";
        } else {
            showError(`Error: ${registrationData.error}`);
        }

    } catch (err) {
        console.error("Error during additional address registration:", err);
        showError(`Error during additional address registration: ${err}`);
    }
});


window.addEventListener("load", async (event) => {
    //console.log("DOM fully loaded and parsed");
    initializePageState();
});

window.ethereum.on('accountsChanged', async (accounts) => {
    hideError();
    signer = provider.getSigner();

    if (!hasSignedWithFirstAddress) {
        address = await signer.getAddress();
        if (!address) {
            document.getElementById("walletContainer").style.display = "block";
            document.getElementById("registration-container").style.display = "none";
        } else {
            document.getElementById("account-container").textContent = `Connected: ${address}`;
            document.getElementById("walletContainer").style.display = "none";
            document.getElementById("registration-container").style.display = "block";
            
            // Check if the address is associated with a username
            await fetchUsernameForAddress(address);
        }
    } else {
        // If the user has signed with the first address, continue to the next step without resetting the UI
        document.getElementById("switchAndSignContainer").style.display = "block";
    }
});

async function fetchAddressesForUsername(username) {
    console.log("Fetching addresses for username:", username);
    try {
        const response = await fetch(`https://backend.afterlife3030.io/get-addresses?username=${encodeURIComponent(username)}`);
        const data = await response.json();

        if (data.error) {
            showError(`Error: ${data.error}`);
            return;
        }

        if (data.addresses && data.addresses.length > 0) {
            // Display the addresses to the user
            const addressList = document.getElementById("addressList");
            addressList.innerHTML = ''; // Clear any previous addresses
            data.addresses.forEach(addr => {
                const listItem = document.createElement("li");
                listItem.textContent = addr;
                addressList.appendChild(listItem);
            });

            // Optionally, display the address container
            document.getElementById("addressContainer").style.display = "block";
        } else {
            console.log("No addresses found for this username.");
            document.getElementById("addressContainer").style.display = "none";
        }
    } catch (err) {
        console.error("Error fetching addresses:", err);
        showError("Error fetching addresses. Please try again.");
    }
}
