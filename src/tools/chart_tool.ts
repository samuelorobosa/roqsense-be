import { DynamicTool } from "@langchain/core/tools";
import axios from 'axios';

// Define an interface for the chart data
interface ChartData {
  openTime: string;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  closePrice: number;
  volume: number;
}

const chartTool = new DynamicTool({
  name: "chart_tool",
  description: "Retrieve historical price chart data for a cryptocurrency token from Binance",
  func: async (input: string) => {
    try {
      // Validate and prepare the asset symbol
      const asset = input.toUpperCase().trim();

      // Construct the Binance API URL
      const url = `https://api.binance.com/api/v3/klines?symbol=${asset}USDT&interval=1d&limit=30`;

      // Fetch the chart data
      const response = await axios.get(url);
      const chartData: ChartData[] = response.data.map((candle: string[]) => ({
        openTime: new Date(parseInt(candle[0])).toISOString(),
        openPrice: parseFloat(candle[1]),
        highPrice: parseFloat(candle[2]),
        lowPrice: parseFloat(candle[3]),
        closePrice: parseFloat(candle[4]),
        volume: parseFloat(candle[5])
      }));

      // Prepare a human-readable summary
      const summary = `Chart data for ${asset}/USDT over the last 30 days:
      - Lowest Price: $${Math.min(...chartData.map((d: ChartData) => d.lowPrice)).toFixed(2)}
      - Highest Price: $${Math.max(...chartData.map((d: ChartData) => d.highPrice)).toFixed(2)}
      - Current Close Price: $${chartData[chartData.length - 1].closePrice.toFixed(2)}
      - Total Trading Volume: ${chartData.reduce((sum: number, d: ChartData) => sum + d.volume, 0).toLocaleString()} USDT`;

      return JSON.stringify({
        summary,
        fullData: chartData
      });
    } catch (error) {
      if (error instanceof Error) {
        return `Error retrieving chart data for ${input}: ${error.message}`;
      }
      return `Unexpected error retrieving chart data for ${input}`;
    }
  }
});

export default chartTool;
