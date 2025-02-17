import { config } from "dotenv";
import { Connection, GetProgramAccountsFilter, PublicKey, ParsedAccountData } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

config();

const connection = new Connection(
    process.env.QUIKNODE_RPC || "https://api.devnet.solana.com",
    "confirmed"
);

async function getNumberDecimals(mintAddress: string): Promise<number> {
    const info = await connection.getParsedAccountInfo(new PublicKey(mintAddress));
    const result = (info.value?.data as ParsedAccountData).parsed.info.decimals as number;
    return result;
}

async function getTokenList(wallet: string, connection: Connection) {

    const tokenList = [];

    const filters: GetProgramAccountsFilter[] = [
        {
            dataSize: 165,
        },
        {
            memcmp: {
                offset: 32,
                bytes: wallet,
            },
        }];

    const accounts = await connection.getParsedProgramAccounts(
        TOKEN_PROGRAM_ID,
        { filters: filters }
    );

    for (const [i, account] of accounts.entries()) {
        const parsedAccountInfo: any = account.account.data;
        const mintAddress: string = parsedAccountInfo["parsed"]["info"]["mint"];
        const tokenBalance: number = parsedAccountInfo["parsed"]["info"]["tokenAmount"]["uiAmount"];
        if (tokenBalance > 0.001) {
            tokenList.push({ mintAddress, tokenBalance })
        }
    }

    return tokenList;
}

export {
    getTokenList,
    getNumberDecimals
};
