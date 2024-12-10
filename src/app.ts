import express, { Application } from 'express';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from "uuid";
import { workflow } from './modules/workflow'
import { classifyIntent } from './modules/classifyIntent'
import { callExtractAsset } from './modules/callExtractAssets'
import { axiosService } from './modules/axios'
dotenv.config();

const app: Application = express();
const PORT = 8000;


// Middleware to parse JSON request bodies
app.use(express.json());



app.get('/', (req, res) => {
    res.send('Hello World');
})

app.post('/api/v1/chat', async (req, res) => {
    const message = req.body.message;
    const thread_id = req.body.thread_id || uuidv4();

    // Check for intent
    const intent =  await classifyIntent(message);
    if (intent.includes("crypto asset")) {
        const { asset } = await callExtractAsset(message);
        const response =  await workflow( message, { configurable: { thread_id } })

        const targetAsset = asset.split(/[\s,]+/);
        const historic_data = []

        for(let i = 0; i < targetAsset?.length; i++) {
            // Make a request to a binance endpoint to get coin historic data
            const response = await axiosService.getHistoricData(targetAsset[i])
            historic_data.push(
              {
                  asset: targetAsset[i],
                  data: typeof response === 'string' ? response : response.data
              }
            )
        }

        res.status(200).json({
            status: "success",
            message: "Message sent successfully",
            data: {
                messages: response.messages[response.messages.length - 1]?.content,
                thread_id: thread_id,
                intent: intent,
                asset: targetAsset,
                historic_data: historic_data
            },
        });
    } else {
        const response =  await workflow( message, { configurable: { thread_id } });
        res.status(200).json({
            status: "success",
            message: "Message sent successfully",
            data: {
                messages: response.messages[response.messages.length - 1].content,
                thread_id: thread_id,
            },
        });
    }
})


app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
})
