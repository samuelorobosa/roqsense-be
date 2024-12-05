import express, { Application } from 'express';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from "uuid";
import {
    START,
    END,
    MessagesAnnotation,
    StateGraph,
    MemorySaver,
} from "@langchain/langgraph";
import { ChatOpenAI } from '@langchain/openai';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 8000;

const llm = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model: "gpt-4o-mini",
    temperature: 0.7
});

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
      // .then((response) => {
      //     console.log(response.messages[response.messages.length - 1]);
      // })

    res.json({
        message: "success",
        data: response.messages[response.messages.length - 1],
        thread_id: thread_id,
    });
})


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})
