import { config } from "dotenv";
import axios from "axios";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  VersionedTransaction,
  Connection,
  BlockhashWithExpiryBlockHeight,
  Keypair,
} from "@solana/web3.js";
import bs58 from "bs58";

config();

const connection = new Connection(process.env.QUIKNODE_RPC || "");

interface TipAccountResponse {
  jsonrpc: string;
  id: number;
  result: string[];
  error?: { message: string };
}

interface BundleStatus {
  bundleId: string;
  status: string;
  landedSlot?: number;
}

async function getTipAccounts(): Promise<string[]> {
  try {
    const response = await axios.post<TipAccountResponse>(
      "https://mainnet.block-engine.jito.wtf/api/v1/bundles",
      {
        jsonrpc: "2.0",
        id: 1,
        method: "getTipAccounts",
        params: [],
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    if (response.data.error) {
      throw new Error(response.data.error.message);
    }

    return response.data.result;
  } catch (error: any) {
    console.error("❌ Error getting tip accounts:", error.message);
    throw error;
  }
}

async function createJitoBundle(transaction: Transaction | VersionedTransaction, wallet:Keypair): Promise<string[]> {
  try {
    const tipAccounts = await getTipAccounts();
    if (!tipAccounts || tipAccounts.length === 0) {
      throw new Error("❌ Failed to get Jito tip accounts");
    }

    const tipAccountPubkey = new PublicKey(
      tipAccounts[Math.floor(Math.random() * tipAccounts.length)]
    );

    const tipInstruction = SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: tipAccountPubkey,
      lamports: 1000000,
    });

    const latestBlockhash: BlockhashWithExpiryBlockHeight = await connection.getLatestBlockhash("finalized");

    const tipTransaction = new Transaction().add(tipInstruction);
    tipTransaction.recentBlockhash = latestBlockhash.blockhash;
    tipTransaction.feePayer = wallet.publicKey;
    
    // Sign the transaction using the signTransaction method
    tipTransaction.sign(wallet);

    const bundle = [tipTransaction, transaction].map((tx) => {
      if (tx instanceof VersionedTransaction) {
        return bs58.encode(tx.serialize());
      } else {
        return bs58.encode(tx.serialize({ verifySignatures: false }));
      }
    });

    console.log("✅ Bundle created successfully");
    return bundle;
  } catch (error: any) {
    console.error("❌ Error in createJitoBundle:", error.message);
    console.error("🔍 Error stack:", error.stack);
    throw error;
  }
}

async function sendJitoBundle(bundle: string[]): Promise<string> {
  try {
    const response = await axios.post<{ jsonrpc: string; id: number; result: string; error?: { message: string } }>(
      "https://mainnet.block-engine.jito.wtf/api/v1/bundles",
      {
        jsonrpc: "2.0",
        id: 1,
        method: "sendBundle",
        params: [bundle],
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    if (response.data.error) {
      throw new Error(response.data.error.message);
    }
    return response.data.result;
  } catch (error: any) {
    console.error("❌ Error sending Jito bundle:", error.message);
    throw error;
  }
}

async function checkBundleStatus(bundleId: string): Promise<BundleStatus | null> {
  try {
    const response = await axios.post<{ jsonrpc: string; id: number; result: { value: { bundle_id: string; status: string; landed_slot?: number }[] }; error?: { message: string } }>(
      "https://mainnet.block-engine.jito.wtf/api/v1/bundles",
      {
        jsonrpc: "2.0",
        id: 1,
        method: "getInflightBundleStatuses",
        params: [[bundleId]],
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    if (response.data.error) {
      throw new Error(response.data.error.message);
    }

    const result = response.data.result.value[0];
    if (!result) {
      console.log(`ℹ️ No status found for bundle ID: ${bundleId}`);
      return null;
    }

    return {
      bundleId: result.bundle_id,
      status: result.status,
      landedSlot: result.landed_slot,
    };
  } catch (error: any) {
    console.error("❌ Error checking bundle status:", error.message);
    return null;
  }
}

export { createJitoBundle, sendJitoBundle, checkBundleStatus };
