import express, { Application } from 'express';
import dotenv from 'dotenv';
import {
    START,
    END,
    MessagesAnnotation,
    StateGraph,
    MemorySaver,
} from "@langchain/langgraph";
import { ChatOpenAI } from '@langchain/openai';
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const app: Application = express();
const PORT = 8000;

const llm = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model: "gpt-4o-mini",
    temperature: 0.7
});

// Middleware to parse JSON request bodies
app.use(express.json());

// Define the function that calls the model
const callModel = async (state: typeof MessagesAnnotation.State) => {
    const response = await llm.invoke(state.messages);
    return { messages: response };
}

const workflow = new StateGraph(MessagesAnnotation)
  // Define the node and edge
  .addNode("model", callModel)
  .addEdge(START, "model")
  .addEdge("model", END);

// Add memory
const memory = new MemorySaver();

// Compile the workflow and create the app
const chatbotApp = workflow.compile({ checkpointer: memory });


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
    const config = { configurable: { thread_id: thread_id } };
    const response=  await chatbotApp.invoke({ messages: input }, config)

    res.status(200).json({
        status: "success",
        message: "Message sent successfully",
        data: {
            messages: response.messages[response.messages.length - 1],
            thread_id: thread_id,
        },
    });
})


app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
})
