import { config } from "dotenv";
import axios from "axios";
import { TokenInfo, TokenPrice, TokenInfo2 } from "../types/tokenTypes";

config();


if (!process.env.QUIKNODE_RPC || !process.env.DEX_TOOL_TOKEN) {
  throw new Error("Required environment variables are missing.");
}


async function fetchTokenData(endpoint: string, address: string): Promise<any | null> {
    const url = `https://public-api.dextools.io/trial/v2/token/solana/${address}/${endpoint}`;
    try {
      const res = await axios.get(url, {
        headers: { "x-api-key": process.env.DEX_TOOL_TOKEN },
      });
      return res.data.data;
    } catch (err) {
      console.error(`Error fetching ${endpoint} data from Dextools for address ${address}: ${err}`);
      return null; 
    }
  }
  
  async function getTokenInfo(address: string): Promise<TokenInfo | null> {
    return await fetchTokenData("", address);
  }

async function getTokenPrice(address: string): Promise<TokenPrice | null> {
  return await fetchTokenData("price", address);
}

async function getTokenInfo2(address: string): Promise<TokenInfo2 | null> {
  return await fetchTokenData("info", address);
}

export { getTokenInfo, getTokenPrice, getTokenInfo2 };
