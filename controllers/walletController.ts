import { config } from "dotenv";

import bs58 from "bs58";
import {
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    Transaction,
    SystemProgram,
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

config();

const connection = new Connection(
    process.env.QUIKNODE_RPC || "https://api.devnet.solana.com",
    "confirmed"
);



const swapToken = async (inputMint: string, outputMint: string, amount: number, slippageBps: number): Promise<void> => {
    try {

        if (!process.env.PRIVATE_KEY) {
            throw new Error("PRIVATE_KEY  is not set.");
        }

        const privateKeyBytes = bs58.decode(process.env.PRIVATE_KEY);
        const userWallet = Keypair.fromSecretKey(privateKeyBytes);
        const publicKey = userWallet.publicKey;
        // Step 1: Retrieve Quote from Jupiter

        const inputDecimals = await getNumberDecimals(inputMint);

        const quoteResponse = await getQuote(
            inputMint,
            outputMint,
            amount * Math.pow(10, inputDecimals),
            slippageBps
        );
        if (!quoteResponse?.routePlan) {
            console.log("Failed to retrieve a quote. Please try again later.");
            return;
        }
        console.log("✅ Quote received successfully");

        // Step 2: Get Swap Instructions
        const swapInstructions = await getSwapInstructions(
            quoteResponse,
            publicKey.toString()
        );
        if (swapInstructions === null) {
            console.log("Failed to get swap instructions. Please try again later.");
            return;
        }
        console.log("✅ Swap instructions received successfully");

        const {
            setupInstructions,
            swapInstruction: swapInstructionPayload,
            cleanupInstruction,
            addressLookupTableAddresses,
        } = swapInstructions;
        const swapInstruction = deserializeInstruction(swapInstructionPayload);

        // Step 3: Prepare Transaction Instructions
        const instructions = [
            ...setupInstructions.map(deserializeInstruction),
            swapInstruction,
            ...(cleanupInstruction ? [deserializeInstruction(cleanupInstruction)] : []),
        ];

        const addressLookupTableAccounts = await getAddressLookupTableAccounts(addressLookupTableAddresses);
        const latestBlockhash = await connection.getLatestBlockhash('finalized');
        if (!latestBlockhash?.blockhash)
            console.log("Failed to fetch latest blockhash.");
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

        // Step 6: Create and Send Jito Bundle
        const jitoBundle = await createJitoBundle(transaction, userWallet);
        const bundleId = await sendJitoBundle(jitoBundle);

        // Final confirmation and transaction link
        const signature = bs58.encode(transaction.signatures[0]);
        console.log(
            `✨ Swap executed successfully! 🔗 View on Solscan: https://solscan.io/tx/${signature}`
        );

        console.log(`✅ Jito bundle sent. Bundle ID: ${bundleId}`);

    } catch (err) {

    }
}


export {
    swapToken
};
