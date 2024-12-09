// import express, { Application } from 'express';
// import dotenv from 'dotenv';
// import {
//     START,
//     END,
//     MessagesAnnotation,
//     StateGraph,
//     MemorySaver,
// } from "@langchain/langgraph";
// import { ChatOpenAI } from '@langchain/openai';
// import { v4 as uuidv4 } from "uuid";
// import {
//     ChatPromptTemplate,
//     MessagesPlaceholder,
// } from "@langchain/core/prompts";
//
// dotenv.config();
//
// const app: Application = express();
// const PORT = 8000;
//
//
// // Middleware to parse JSON request bodies
// app.use(express.json());
//
//
// const llm = new ChatOpenAI({
//     apiKey: process.env.OPENAI_API_KEY,
//     model: "gpt-4o-mini",
//     temperature: 0.7
// });
//
// const prompt = ChatPromptTemplate.fromMessages([
//     [
//         "system",
//         `
//         You are Zeus, a chatbot designed to answer only questions related to cryptocurrency and Roqqu. Roqqu is a platform for buying, selling, and managing cryptocurrency. You are polite, knowledgeable, and concise. If a user asks a question unrelated to cryptocurrency or Roqqu, politely decline to answer and remind them of your purpose.
//
//         For example:
//         - If asked about cryptocurrency, provide expert insights or factual information.
//         - If asked about Roqqu, explain its features and use cases.
//         - If asked about anything else (e.g., sports, weather, random topics), respond with: "I'm sorry, but I can only assist with questions about cryptocurrency and Roqqu."
//         - You can answer questions about the users themselves, such as "How can I buy Bitcoin?" or "What is Roqqu?" or "What is my name?"
//         - Sometimes, sneak in a little humor to your responses. Don't be too serious all the time. Also, don't be too casual. Maintain a balance.
//         - When you provide an answer, you don't need to always remind the user of your purpose. Just answer the question. Only remind them when they ask unrelated questions.
//
//         Always address users respectfully, refer to yourself as Zeus and add humor to your responses`,
//     ],
//     new MessagesPlaceholder("messages"),
// ]);
//
//
// // Define the function that calls the model
// const callModel = async (state: typeof MessagesAnnotation.State) => {
//     const chain = prompt.pipe(llm)
//     const response = await chain.invoke(state);
//     // Update message history with response:
//     return { messages: [response] };
// }
//
// const workflow = new StateGraph(MessagesAnnotation)
//   // Define the node and edge
//   .addNode("model", callModel)
//   .addEdge(START, "model")
//   .addEdge("model", END);
//
// // Add memory
// const memory = new MemorySaver();
//
// // Compile the workflow and create the app
// const chatbotApp = workflow.compile({ checkpointer: memory });
//
// app.get('/', (req, res) => {
//     res.send('Hello World');
// })
// app.post('/api/v1/chat', async (req, res) => {
//     const message = req.body.message;
//     const thread_id = req.body.thread_id || uuidv4();
//     const input = [
//         {
//             role: "user",
//             content: message,
//         },
//     ];
//     const config = { configurable: { thread_id: thread_id } };
//     const response=  await chatbotApp.invoke({ messages: input }, config)
//
//     res.status(200).json({
//         status: "success",
//         message: "Message sent successfully",
//         data: {
//             messages: response.messages[response.messages.length - 1],
//             thread_id: thread_id,
//         },
//     });
// })
//
//
// app.listen(PORT, async () => {
//     console.log(`Server running on port ${PORT}`);
// })


import express, { Application } from 'express';
import dotenv from 'dotenv';
import { ChatOpenAI } from '@langchain/openai'
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { ToolNode } from '@langchain/langgraph/prebuilt'
import {
    // MemorySaver,
    MessagesAnnotation, StateGraph } from '@langchain/langgraph'
// import { v4 as uuidv4 } from "uuid";
import { HumanMessage } from "@langchain/core/messages";
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
dotenv.config();

const app: Application = express();
const PORT = 8000;


// Middleware to parse JSON request bodies
app.use(express.json());



// Agent Config
// Define the tools for the agent to use
// Define the tools for the agent to use
const tools = [new TavilySearchResults({ maxResults: 3, apiKey: process.env.TAVILY_API_KEY })];
const toolNode = new ToolNode(tools);

// Create a model and give it access to the tools
const model = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model: "gpt-4o-mini",
    temperature: 0.7,
}).bindTools(tools);

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

// Define the function that determines whether to continue or not
function shouldContinue({ messages }: typeof MessagesAnnotation.State) {
    const lastMessage = messages[messages.length - 1];

    // If the LLM makes a tool call, then we route to the "tools" node
    if (lastMessage.additional_kwargs.tool_calls) {
        return "tools";
    }
    // Otherwise, we stop (reply to the user) using the special "__end__" node
    return "__end__";
}

// Define the function that calls the model
async function callModel(state: typeof MessagesAnnotation.State) {
    const chain = prompt.pipe(model);
    const response = await chain.invoke(state);
    // We return a list, because this will get added to the existing list
    return { messages: [response] };
}

// Define a new graph
const workflow = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel)
  .addEdge("__start__", "agent") // __start__ is a special name for the entrypoint
  .addNode("tools", toolNode)
  .addEdge("tools", "agent")
  .addConditionalEdges("agent", shouldContinue);

// Finally, we compile it into a LangChain Runnable.
const zeus = workflow.compile();



// // Initialize memory to persist state between graph runs
// const agentCheckpointer = new MemorySaver();
// const agent = createReactAgent({
//     llm: agentModel,
//     tools: agentTools,
//     checkpointSaver: agentCheckpointer,
// });

app.get('/', (req, res) => {
    res.send('Hello World');
})

app.post('/api/v1/chat', async (req, res) => {
    const message = req.body.message;
    // const thread_id = req.body.thread_id || uuidv4();

    // Now it's time to use!
    const agentFinalState = await zeus.invoke(
      { messages: [new HumanMessage(message)] },
      // { configurable: { thread_id } },
    );


    res.status(200).json({
        status: "success",
        message: "Message sent successfully",
        data: {
            messages: agentFinalState.messages[agentFinalState.messages.length - 1].content,
            // thread_id: thread_id,
        },
    });
})


app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
})
