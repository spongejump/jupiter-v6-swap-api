import express from 'express';
import { buyTokens, sellTokens } from './controllers/walletController';
import bodyParser from 'body-parser';

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

const startBuySellCycle = async () => {
  try {
    console.log("Starting token purchase...");
    await buyTokens();
    console.log("Token purchase completed.");

    console.log("Starting token sale...");
    await sellTokens();
    console.log("Token sale completed.");
  } catch (error) {
    console.error("Error during buy-sell cycle:", error);
  }
};

setInterval(() => {
  startBuySellCycle();
}, 2 * 60 * 60 * 1000);


app.post('/buy-tokens', async (req, res) => {
  try {
    console.log("Manually triggering token purchase...");
    await buyTokens();
    res.status(200).send("Tokens successfully bought.");
  } catch (error) {
    console.error("Error buying tokens:", error);
    res.status(500).send("An error occurred while buying tokens.");
  }
});

app.post('/sell-tokens', async (req, res) => {
  try {
    console.log("Manually triggering token sale...");
    await sellTokens();
    res.status(200).send("Tokens successfully sold.");
  } catch (error) {
    console.error("Error selling tokens:", error);
    res.status(500).send("An error occurred while selling tokens.");
  }
});

app.get('/', (req, res) => {
  res.send('Welcome to the Token Swap API!');
});

// Start server
app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
