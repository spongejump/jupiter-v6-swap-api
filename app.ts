import "dotenv/config";
import express, { Request, Response } from "express";
import { swapToken } from "./controllers/walletController";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

/**
 * @route POST /swapToken
 * @desc Swap tokens using the `swapToken` function
 * @access Public
 */

app.post("/swapToken", async (req: Request, res: Response): Promise<void> => {
  const { inputMint, outputMint, amount, slippageBps } = req.body;

  if (!inputMint || !outputMint || !amount || !slippageBps) {
    res.status(400).json({ error: "Missing required fields." });
    return;
  }

  try {
    await swapToken(inputMint, outputMint, parseFloat(amount), parseFloat(slippageBps));

    res.status(200).json({ message: "Swap executed successfully." });
  } catch (err) {
    console.error("Error during token swap:", err);
    res.status(500).json({ error: "Failed to execute swap.", details: err || "Unknown error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});