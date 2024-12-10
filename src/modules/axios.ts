import axios from 'axios'

export class axiosService {
  static async getHistoricData(asset: string) {
    try {
      const url = `https://api.binance.com/api/v3/klines?symbol=${asset}USDT&interval=1d&limit=30`
      return await axios.get(url)
    } catch (error) {
      if (error instanceof Error) {
        return `Error retrieving chart data for ${asset}: ${error.message}`
      }
      return `Unexpected error retrieving chart data for ${asset}`
    }
  }
}
