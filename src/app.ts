import express, { Application } from 'express';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from "uuid";
import { callChatStream } from './functions/callChatStream';
import { callExtractAsset } from './functions/callExtractAssets';
import { callRetrieval } from './functions/callRetrieval';

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
    const response=  await callChatStream( message, config);

    res.status(200).json({
        status: "success",
        message: "Message sent successfully",
        data: {
            messages: response.messages[response.messages.length - 1],
            thread_id: thread_id,
        },
    });

    // console.log(await callExtractAsset())
    // console.log(await callRetrieval())

    // Check intent
    console.log("Extract assets", await callRetrieval(message))
    // console.log(matchIntent(message))
    // console.log("llm", await classifyIntent(message))
    // console.log("chat", await callChatStream( message, config))
})


app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
})
