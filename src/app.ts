import express, { Application } from 'express';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from "uuid";
import { callChatStream } from './functions/callChatStream';
import { callExtractAsset } from './functions/callExtractAssets';
import { callRetrieval } from './functions/callRetrieval';
import { classifyIntent } from './functions/classifyIntent';
import { AxiosService } from './functions/axiosServices';
const axios = require('axios');

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
    const input = [
        {
            role: "user",
            content: message,
        },
    ];
    const config = { configurable: { thread_id } };

    // Check for intent
    const intent =  await classifyIntent(message);
    if (intent.includes("crypto asset")) {
        const { asset } = await callExtractAsset(message);
        const response =  await callChatStream( message, config);

        const targetAsset = asset.split(/[\s,]+/);
        const historic_data = []

        for(let i = 0; i < targetAsset?.length; i++) {
        // Make a request to a binance endpoint to get coin historic data
            const response = await AxiosService.getHistoricData(targetAsset[i])
            historic_data.push(
                {
                    asset: targetAsset[i],
                    data: response.data
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
        const response =  await callChatStream( message, config);

    res.status(200).json({
        status: "success",
        message: "Message sent successfully",
        data: {
            messages: response.messages[response.messages.length - 1]?.content,
            thread_id: thread_id,
            intent: intent
        },
    });

    }

    
    // console.log(await callExtractAsset())
    // console.log(await callRetrieval())

    // Check intent
    console.log("Extract assets", await callRetrieval(message))
    // console.log(matchIntent(message))
    // console.log("chat", await callChatStream( message, config))
})


app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
})
