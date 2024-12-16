import { config } from "dotenv";
import axios from "axios";
import { QuoteResponse, SwapInstructionsResponse } from "../types/tokenTypes";

config();


async function getQuote(
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps: number
): Promise<QuoteResponse> {
  const response = await axios.get<QuoteResponse>(
    `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}`
  );
  return response.data;
}

async function getSwapInstructions(
  quoteResponse: QuoteResponse,
  userPublicKey: string
): Promise<SwapInstructionsResponse> {
  const response = await axios.post<SwapInstructionsResponse>(
    `https://quote-api.jup.ag/v6/swap-instructions`,
    {
      quoteResponse,
      userPublicKey,
      wrapUnwrapSOL: true,
    }
  );
  return response.data;
}

export { getQuote, getSwapInstructions };
