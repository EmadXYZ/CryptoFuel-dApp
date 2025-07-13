// --- Imports ---
import {
    createWalletClient,
    custom,
    formatEther,
    parseEther,
    defineChain,
    createPublicClient,
} from "https://esm.sh/viem";
import "https://esm.sh/viem/window";
import { abi, contractAddress } from "./constants.js";

// --- DOM Element Selection ---
const connectButton = document.getElementById("connectButton");
const fundButton = document.getElementById("fundButton");
const balanceButton = document.getElementById("balanceButton");
const withdrawButton = document.getElementById("withdrawButton");
const ethAmountInput = document.getElementById("ethAmount");
const statusDiv = document.getElementById("status");

// --- Client Variables ---
let walletClient;
let publicClient;

// --- Helper Functions ---

/**
 * Displays a status message to the user.
 * @param {string} message - The message to display.
 * @param {'info' | 'success' | 'error'} type - The type of message, for styling.
 */
function showStatus(message, type = "info") {
    statusDiv.className = `status-message ${type}`;
    statusDiv.textContent = message;
}

/**
 * Toggles the disabled state of action buttons to prevent multiple clicks.
 * @param {boolean} disabled - Whether to disable the buttons.
 */
function toggleButtons(disabled) {
    fundButton.disabled = disabled;
    withdrawButton.disabled = disabled;
    balanceButton.disabled = disabled;

    if (disabled && document.activeElement.id === "fundButton") {
        fundButton.textContent = "Processing...";
    } else if (disabled && document.activeElement.id === "withdrawButton") {
        withdrawButton.textContent = "Withdrawing...";
    } else {
        fundButton.textContent = "Fund";
        withdrawButton.textContent = "Withdraw";
    }
}

/**
 * **New Feature:** Parses a raw blockchain error and returns a human-readable string.
 * This function checks for common error types and extracts the most useful message.
 * @param {Error} error - The error object from a try/catch block.
 * @returns {string} A user-friendly error message.
 */
function getFriendlyErrorMessage(error) {
    // Log the full error to the console for the developer's reference
    console.error("An error occurred:", error);

    // Recursively find the root cause of the error
    let cause = error;
    while (cause.cause) {
        cause = cause.cause;
    }

    // Check for common, user-actionable errors first
    if (cause.name === "UserRejectedRequestError" || cause.code === 4001) {
        return "Transaction rejected. You canceled the request in your wallet.";
    }
    if (cause.name === "ContractFunctionRevertedError") {
        // This is a revert from the smart contract (e.g., from a 'require' statement)
        // The 'reason' is the most user-friendly part.
        return cause.reason || "The transaction was reverted by the contract.";
    }
    if (cause.message && cause.message.includes("insufficient funds")) {
        return "Insufficient funds to complete the transaction (including gas fees).";
    }
    if (cause.message && cause.message.includes("403")) {
        return "Request forbidden. Your RPC provider may be blocking the request.";
    }
    if (cause.name === "TimeoutError") {
        return "Network request timed out. Please check your internet connection.";
    }

    // A fallback for all other unexpected errors
    return "An unexpected error occurred. Please try again.";
}

// --- Core Application Logic ---

/**
 * Connects to the user's Ethereum wallet (e.g., MetaMask).
 */
async function connect() {
    // ... (This function remains the same, no transactions are sent)
    if (typeof window.ethereum !== "undefined") {
        try {
            walletClient = createWalletClient({ transport: custom(window.ethereum) });
            await walletClient.requestAddresses();
            connectButton.textContent = "Connected ✅";
            connectButton.disabled = true;
            showStatus("Wallet connected successfully.", "success");
        } catch (error) {
            console.error(error);
            showStatus(`Connection failed: ${error.message}`, "error");
        }
    } else {
        connectButton.textContent = "Install MetaMask";
        showStatus("Please install the MetaMask extension.", "error");
    }
}

/**
 * Sends a specified amount of ETH to the smart contract.
 */
async function fund() {
    const ethAmount = ethAmountInput.value;
    if (!ethAmount || parseFloat(ethAmount) <= 0) {
        showStatus("Please enter a valid amount.", "error");
        return;
    }
    toggleButtons(true);
    showStatus(`Funding with ${ethAmount} ETH... please wait.`, "info");

    try {
        const chainIdHex = await window.ethereum.request({ method: "eth_chainId" });
        const chain = defineChain({ id: parseInt(chainIdHex, 16) });
        walletClient = createWalletClient({ chain, transport: custom(window.ethereum) });
        publicClient = createPublicClient({ chain, transport: custom(window.ethereum) });
        const [account] = await walletClient.requestAddresses();

        const { request } = await publicClient.simulateContract({
            address: contractAddress,
            abi,
            functionName: "fund",
            account,
            value: parseEther(ethAmount),
        });
        const hash = await walletClient.writeContract(request);
        showStatus("Transaction sent. Awaiting confirmation...", "info");

        await publicClient.waitForTransactionReceipt({ hash });
        showStatus("Funding successful! Refreshing balance...", "success");
        await getBalance();
    } catch (error) {
        // **IMPROVEMENT:** Use the new function for professional error display
        const friendlyMessage = getFriendlyErrorMessage(error);
        showStatus(friendlyMessage, "error");
    } finally {
        toggleButtons(false);
        ethAmountInput.value = "";
    }
}

/**
 * Retrieves the current balance of the smart contract and displays it.
 */
async function getBalance() {
    balanceButton.disabled = true;
    balanceButton.textContent = "Fetching...";
    showStatus("Fetching balance from the blockchain...", "info");

    try {
        const chainIdHex = await window.ethereum.request({ method: "eth_chainId" });
        const chain = defineChain({ id: parseInt(chainIdHex, 16) });
        publicClient = createPublicClient({ chain, transport: custom(window.ethereum) });

        const balance = await publicClient.getBalance({ address: contractAddress, blockTag: "latest" });
        const formattedBalance = formatEther(balance);
        showStatus(`Contract Balance: ${formattedBalance} ETH`, "success");
    } catch (error) {
        const friendlyMessage = getFriendlyErrorMessage(error);
        showStatus(friendlyMessage, "error");
    } finally {
        balanceButton.disabled = false;
        balanceButton.textContent = "Get Balance";
    }
}

/**
 * Calls the 'withdraw' function on the smart contract to transfer funds to the owner.
 */
async function withdraw() {
    toggleButtons(true);
    showStatus("Processing withdrawal request... please wait.", "info");

    try {
        const chainIdHex = await window.ethereum.request({ method: "eth_chainId" });
        const chain = defineChain({ id: parseInt(chainIdHex, 16) });
        walletClient = createWalletClient({ chain, transport: custom(window.ethereum) });
        publicClient = createPublicClient({ chain, transport: custom(window.ethereum) });
        const [account] = await walletClient.requestAddresses();

        const { request } = await publicClient.simulateContract({
            account,
            address: contractAddress,
            abi,
            functionName: "withdraw",
        });
        const hash = await walletClient.writeContract(request);
        showStatus("Withdrawal sent. Awaiting confirmation...", "info");

        await publicClient.waitForTransactionReceipt({ hash });
        showStatus("Withdrawal successful! Refreshing balance...", "success");
        await getBalance();
    } catch (error) {
        // **IMPROVEMENT:** Use the new function for professional error display
        const friendlyMessage = getFriendlyErrorMessage(error);
        showStatus(friendlyMessage, "error");
    } finally {
        toggleButtons(false);
    }
}

// --- Event Listeners ---
connectButton.onclick = connect;
fundButton.onclick = fund;
balanceButton.onclick = getBalance;
withdrawButton.onclick = withdraw;