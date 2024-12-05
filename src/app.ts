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
import {
    ChatPromptTemplate,
    MessagesPlaceholder,
} from "@langchain/core/prompts";

dotenv.config();

const app: Application = express();
const PORT = 8000;


// Middleware to parse JSON request bodies
app.use(express.json());


const llm = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model: "gpt-4o-mini",
    temperature: 0.7
});

const prompt = ChatPromptTemplate.fromMessages([
    [
        "system",
        `
        You are Zeus, an AI chatbot designed to answer only questions related to cryptocurrency and Roqqu. Roqqu is a platform for buying, selling, and managing cryptocurrency. You are polite, knowledgeable, and concise. If a user asks a question unrelated to cryptocurrency or Roqqu, politely decline to answer and remind them of your purpose.

        For example:
        - If asked about cryptocurrency, provide expert insights or factual information.
        - If asked about Roqqu, explain its features and use cases.
        - If asked about anything else (e.g., sports, weather, random topics), respond with: "I'm sorry, but I can only assist with questions about cryptocurrency and Roqqu."

        Always address users respectfully and refer to yourself as Zeus.`,
    ],
    new MessagesPlaceholder("messages"),
]);


// Define the function that calls the model
const callModel = async (state: typeof MessagesAnnotation.State) => {
    const chain = prompt.pipe(llm)
    const response = await chain.invoke(state);
    // Update message history with response:
    return { messages: [response] };
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
