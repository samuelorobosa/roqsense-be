import express, { Application } from 'express';
import dotenv from 'dotenv';
import { workflow } from './modules/workflow'
import { classifyIntent } from './modules/classifyIntent'
import { callExtractAsset } from './modules/callExtractAssets'
import { axiosService } from './modules/axios'
import { ChatPromptTemplate } from '@langchain/core/prompts';
dotenv.config();

const app: Application = express();
const PORT = 8000;

// Middleware to parse JSON request bodies
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.post('/api/v1/chat', async (req, res) => {
    const message = req.body.message;
    console.log('Message:', message);
    const thread_id = req.body.thread_id;

    // Essential headers for continuous streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Connection', 'keep-alive');

    // Start streaming
    res.write(`event: message\n`);
    res.write(`data: ${JSON.stringify({ status: "processing", step: "starting" })}\n\n`);

    try {
        // Check intent
        const intent = await classifyIntent(message);
        res.write(`data: ${JSON.stringify({ status: "processing", step: "intent_classified", intent })}\n\n`);

        // Stream response function
        const streamResponse = async (response: {
          messages: string | any[]
        }) => {
          const fullContent =
            response.messages[response.messages.length - 1]?.content || ''

          // Stream the response character by character
          for (let i = 0; i < fullContent.length; i++) {
            res.write(
              `data: ${JSON.stringify({
                status: 'streaming',
                chunk: fullContent[i],
                isDone: i === fullContent.length - 1
              })}\n\n`
            )

            // Simulate typing speed (adjust as needed)
            await new Promise((resolve) => setTimeout(resolve, 20))
          }
        }

        if (intent.includes("crypto asset")) {
            const { asset } = await callExtractAsset(message);
            const response = await workflow(message, { configurable: { thread_id } });
            
            const targetAsset = asset.split(/[\s,]+/);
            const historic_data = [];
            
            for (let i = 0; i < targetAsset.length; i++) {
                // Fetch historical data for each asset
                const response = await axiosService.getHistoricData(targetAsset[i]);
                if (typeof response === 'string') {
                    res.write(`data: ${JSON.stringify({ status: "error", step: "historic_data_retrieval_failed", asset: targetAsset[i], error: response })}\n\n`);
                } else {
                    historic_data.push({
                        asset: targetAsset[i],
                        data: response.data,
                    });
                    
                    res.write(`data: ${JSON.stringify({ status: "processing", step: "historic_data_retrieved", asset: targetAsset[i], data: response.data })}\n\n`);
                }
            }
            
            // Stream the final response
            await streamResponse(response);

            // Final event
            res.write(`data: ${JSON.stringify({
                status: "success",
                message: "Message processed successfully",
                data: {
                    thread_id: thread_id,
                    intent: intent,
                    asset: targetAsset,
                    historic_data: historic_data,
                },
            })}\n\n`);

        } else if (intent.includes("trade history")) {
            const user_trade_history = await axiosService.getHistoricData("BTC")
            const userTradeHistory = typeof user_trade_history === 'string' ? user_trade_history :  JSON.stringify(user_trade_history?.data);
            const chatPrompt = ChatPromptTemplate.fromMessages([
                { role: 'system', content: `Based on the user's trade history: ${userTradeHistory}` },
                { role: 'user', content: message }
            ]);

            const response = await workflow(message, { configurable: { thread_id } }, chatPrompt);

            // Stream the final response
            await streamResponse(response);

            // Final event
            res.write(`data: ${JSON.stringify({
                status: "success",
                message: "Message sent successfully",
                data: {
                    thread_id: thread_id,
                    intent: intent,
                    trade_history: userTradeHistory
                },
            })}\n\n`);

        } else {
            const response = await workflow(message, { configurable: { thread_id } });

            // Stream the final response
            await streamResponse(response);

            // Final event
            res.write(`data: ${JSON.stringify({
                status: "success",
                message: "Message processed successfully",
                data: {
                    thread_id: thread_id,
                },
            })}\n\n`);
        }
    } catch (error) {
        if (error instanceof Error) {
            res.write(`data: ${JSON.stringify({ status: "error", step: "processing_failed", error: error.message })}\n\n`);
        } else {
            res.write(`data: ${JSON.stringify({ status: "error", step: "processing_failed", error: "Unexpected error" })}\n\n`);
        }
    } finally {
        res.write('event: end\n');
        res.write('data: [DONE]\n\n');
        res.end();
    }
});

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
});
