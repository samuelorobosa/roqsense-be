// Create a service class

import axios from "axios";

export class AxiosService {
    // Fetches historic data for a given asset
    static async getHistoricData(asset: string) {
        const url = `https://api.binance.com/api/v3/klines?symbol=${asset}USDT&interval=1d&limit=30`;
        const response = await axios.get(url);
        return response;  
    }
}

module.exports = {
    AxiosService
}