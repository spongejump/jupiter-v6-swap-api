import { config } from "dotenv";
import {
  Connection,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
  ComputeBudgetProgram,
  AddressLookupTableAccount,
  AccountMeta,
} from "@solana/web3.js";

config(); 

if (!process.env.QUIKNODE_RPC) {
  throw new Error("QUIKNODE_RPC environment variable is missing.");
}

const connection = new Connection(process.env.QUIKNODE_RPC);

interface DeserializedInstruction {
  programId: PublicKey;
  keys: AccountMeta[];
  data: Buffer;
}

interface PriorityFee {
  microLamports: number;
}

function deserializeInstruction(instruction: {
  programId: string;
  accounts: { pubkey: string; isSigner: boolean; isWritable: boolean }[];
  data: string;
}): DeserializedInstruction {
  return {
    programId: new PublicKey(instruction.programId),
    keys: instruction.accounts.map((key) => ({
      pubkey: new PublicKey(key.pubkey),
      isSigner: key.isSigner,
      isWritable: key.isWritable,
    })),
    data: Buffer.from(instruction.data, "base64"),
  };
}

async function getAddressLookupTableAccounts(
  keys: string[]
): Promise<AddressLookupTableAccount[]> {
  const addressLookupTableAccounts = await Promise.all(
    keys.map(async (key) => {
      const accountInfo = await connection.getAccountInfo(new PublicKey(key));
      return {
        key: new PublicKey(key),
        state: accountInfo
          ? AddressLookupTableAccount.deserialize(accountInfo.data)
          : null,
      };
    })
  );
  return addressLookupTableAccounts.filter(
    (account) => account.state !== null
  ) as AddressLookupTableAccount[];
}

async function simulateTransaction(
  instructions: DeserializedInstruction[],
  payer: PublicKey,
  addressLookupTableAccounts: AddressLookupTableAccount[],
  maxRetries = 5
): Promise<number | undefined | { error: string }> {
  console.log("🔍 Simulating transaction to estimate compute units...");
  const latestBlockhash = await connection.getLatestBlockhash("confirmed");

  let retries = 0;
  while (retries < maxRetries) {
    try {
      const messageV0 = new TransactionMessage({
        payerKey: payer,
        recentBlockhash: latestBlockhash.blockhash,
        instructions: instructions.filter(Boolean),
      }).compileToV0Message(addressLookupTableAccounts);

      const transaction = new VersionedTransaction(messageV0);

      const simulation = await connection.simulateTransaction(transaction, {
        sigVerify: false,
        replaceRecentBlockhash: true,
      });

      if (simulation.value.err) {
        console.error(
          "❌ Simulation error:",
          JSON.stringify(simulation.value.err, null, 2)
        );
        if (simulation.value.logs) {
          console.error("📜 Simulation logs:", simulation.value.logs);
        }
        throw new Error(
          `❌ Simulation failed: ${JSON.stringify(simulation.value.err)}`
        );
      }

      const unitsConsumed = simulation.value.unitsConsumed || 0;
      console.log("✅ Simulation successful. Units consumed:", unitsConsumed);

      const computeUnits = Math.ceil(unitsConsumed * 1.2);
      return computeUnits;
    } catch (error: any) {
      console.error("❌ Error during simulation:", error.message);
      if (error.message.includes("InsufficientFundsForRent")) {
        return { error: "InsufficientFundsForRent" };
      }
      retries++;
      if (retries >= maxRetries) {
        console.error("❌ Max retries reached. Simulation failed.");
        return undefined;
      }
      console.log(`🔄 Retrying simulation (attempt ${retries + 1})...`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

function createVersionedTransaction(
  instructions: DeserializedInstruction[],
  payer: PublicKey,
  addressLookupTableAccounts: AddressLookupTableAccount[],
  recentBlockhash: string,
  computeUnits: number,
  priorityFee: PriorityFee
): VersionedTransaction {
  const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({
    units: computeUnits,
  });
  const priorityFeeIx = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: priorityFee.microLamports,
  });

  const finalInstructions = [computeBudgetIx, priorityFeeIx, ...instructions];

  const messageV0 = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: recentBlockhash,
    instructions: finalInstructions,
  }).compileToV0Message(addressLookupTableAccounts);

  return new VersionedTransaction(messageV0);
}

export {
  deserializeInstruction,
  getAddressLookupTableAccounts,
  simulateTransaction,
  createVersionedTransaction,
};
