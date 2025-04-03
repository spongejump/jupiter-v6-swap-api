import { config } from "dotenv";
import bs58 from "bs58";
import {
    Connection,
    Keypair,
    PublicKey,
    sendAndConfirmTransaction,
} from "@solana/web3.js";

import { getQuote, getSwapInstructions } from "../api/jupiter_v6";
import {
    deserializeInstruction,
    getAddressLookupTableAccounts,
    simulateTransaction,
    createVersionedTransaction,
} from "../config/transactionUtils";
import { createJitoBundle, sendJitoBundle } from "../api/jitoService";
import { getNumberDecimals, getTokenList } from "../config/getTokenList";
import { fetchTrendingTokens } from "../api/fetchTrends";

config();

const connection = new Connection(
    process.env.QUIKNODE_RPC || "https://api.devnet.solana.com",
    "confirmed"
);

const swapTokens = async (
    inputMints: string[],
    outputMint: string[],
    amounts: number[],
    slippageBps: number
): Promise<void> => {
    try {
        if (!process.env.PRIVATE_KEY) {
            throw new Error("PRIVATE_KEY is not set.");
        }

        const privateKeyBytes = bs58.decode(process.env.PRIVATE_KEY);
        const userWallet = Keypair.fromSecretKey(privateKeyBytes);
        const publicKey = userWallet.publicKey;

        // Step 1: Retrieve Quotes for 5 transactions
        const inputDecimalsPromises = inputMints.map((mint) => getNumberDecimals(mint));
        const inputDecimals = await Promise.all(inputDecimalsPromises);

        const quotePromises = inputMints.map((inputMint, index) =>
            getQuote(inputMint, outputMint[index], amounts[index] * Math.pow(10, inputDecimals[index]), slippageBps)
        );

        const quotes = await Promise.all(quotePromises);
        if (quotes.some((quote) => !quote?.routePlan)) {
            console.log("Failed to retrieve one or more quotes.");
            return;
        }
        console.log("✅ Quotes received successfully");

        // Step 2: Get Swap Instructions for each quote
        const swapInstructionsPromises = quotes.map((quoteResponse) =>
            getSwapInstructions(quoteResponse, publicKey.toString())
        );

        const swapInstructions = await Promise.all(swapInstructionsPromises);
        if (swapInstructions.some((instructions) => instructions === null)) {
            console.log("Failed to get swap instructions.");
            return;
        }
        console.log("✅ Swap instructions received successfully");

        // Step 3: Prepare Transaction Instructions for all swaps
        const instructions = swapInstructions.flatMap((swapInstructionData) => {
            const {
                setupInstructions,
                swapInstruction: swapInstructionPayload,
                cleanupInstruction,
                addressLookupTableAddresses,
            } = swapInstructionData;
            const swapInstruction = deserializeInstruction(swapInstructionPayload);

            return [
                ...setupInstructions.map(deserializeInstruction),
                swapInstruction,
                ...(cleanupInstruction ? [deserializeInstruction(cleanupInstruction)] : []),
            ];
        });

        const addressLookupTableAccounts = await getAddressLookupTableAccounts(
            swapInstructions.flatMap((instruction) => instruction.addressLookupTableAddresses)
        );
        const latestBlockhash = await connection.getLatestBlockhash('finalized');
        if (!latestBlockhash?.blockhash) {
            console.log("Failed to fetch latest blockhash.");
        }

        // Step 4: Simulate Transaction for Compute Units
        let computeUnits = await simulateTransaction(
            instructions,
            publicKey,
            addressLookupTableAccounts,
            5
        );
        if (!computeUnits || typeof computeUnits !== 'number') {
            console.log("Transaction simulation failed or returned invalid compute units.");
            computeUnits = 0;
        }

        // Step 5: Create and Sign Versioned Transaction
        const transaction = createVersionedTransaction(
            instructions,
            publicKey,
            addressLookupTableAccounts,
            latestBlockhash.blockhash,
            computeUnits,
            { microLamports: 0 }
        );
        transaction.sign([userWallet]);

        // Step 6: Create and Send Jito Bundle with Multiple Transactions
        const jitoBundle = await createJitoBundle(transaction, userWallet);
        const bundleId = await sendJitoBundle(jitoBundle);

        // Final confirmation and transaction link
        const signature = bs58.encode(transaction.signatures[0]);
        console.log(
            `✨ Batch swap executed successfully! 🔗 View on Solscan: https://solscan.io/tx/${signature}`
        );
        console.log(`✅ Jito bundle sent. Bundle ID: ${bundleId}`);
    } catch (err) {
        console.error("Error during batch swap:", err);
    }
};

const buyTokens = async () => {
    const buyList = new Array(5).fill({ mintAddress: "So1111111111111111111111111111111111111112", tokenBalance: 0.01 }); // tokenBalance what you want
    const trendingTokens = await fetchTrendingTokens();

    if (!trendingTokens || trendingTokens.length === 0) {
        console.warn("No trending tokens found.");
        return;
    }
    await swapTokens(buyList.map(item => item.mintAddress), trendingTokens.map(token => token.address), buyList.map(item => item.tokenBalance), 50);
}

const sellTokens = async () => {
    const sellList = new Array(5).fill({ mintAddress: "So1111111111111111111111111111111111111112" });
    const tokenList = await getTokenList(process.env.PUBLIC_KEY || "J7sHo1LpayZjcaqw5C9QBqnq5fYWPRRLmdtWeCcJGtLT", connection);
    await swapTokens(tokenList.map(item => item.mintAddress), sellList.map(item => item.mintAddress), tokenList.map(item => item.tokenBalance), 50);
}

export { buyTokens, sellTokens }