import { DynamicTool } from "@langchain/core/tools";
import axios from 'axios';

const chartTool = new DynamicTool({
  name: "asset_prices",
  description: "Retrieve up to date prices on all assets on the Roqqu platform",
  func: async () => {
    try {
      // Construct the Roqqu API URL
      const url = `https://api.roqqupay.com/v2.5/prices`;

      // Fetch the chart data
      const response = await axios.get(url);
      interface PriceData {
        price: number;
        change: number | null;
      }
      
      const prices: { [asset: string]: PriceData } = {};

      // Process the data for each asset
      for (const asset in response.data.data) {
        const assetData = response.data.data[asset];
        prices[asset] = {
          price: parseFloat(assetData.price),
          change: assetData.change !== null ? parseFloat(assetData.change) : null
        };
      }

      // Prepare a human-readable summary for each asset
      const summaries = Object.keys(prices).map(asset => {
        const data = prices[asset];
        return `Asset: ${asset.toUpperCase()}
        - Current Price: $${data.price.toFixed(2)}
        - 24h Change: ${data.change !== null ? data.change.toFixed(2) + '%' : 'N/A'}`;
      }).join('\n\n');

      return JSON.stringify({
        summaries,
        fullData: prices
      });
    } catch (error) {
      if (error instanceof Error) {
        return `Error retrieving chart data: ${error.message}`;
      }
      return `Unexpected error retrieving chart data`;
    }
  }
});

export default chartTool;
