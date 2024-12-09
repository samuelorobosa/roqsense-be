import llm from "./llm";
import { ChatPromptTemplate, MessagesPlaceholder,} from "@langchain/core/prompts";
import { StringOutputParser} from "@langchain/core/output_parsers"
import {
    START,
    END,
    MessagesAnnotation,
    StateGraph,
    MemorySaver
} from "@langchain/langgraph";

// Add memory
const memory = new MemorySaver();

export const callChatStream = async ( input: string, config: any) => {
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

    // The chain that calls the LLM
    const callModel = async (state: typeof MessagesAnnotation.State) => {
        const outputParser = new StringOutputParser();
        const chain = prompt.pipe(llm).pipe(outputParser)
        const response = await chain.invoke(state);
        // Update message history with response:
        return { messages: [response] };
    }


    const workflow = new StateGraph(MessagesAnnotation)
    // Define the node and edge
    .addNode("model", callModel)
    .addEdge(START, "model")
    .addEdge("model", END);

    // Compile the workflow and create the app
    const chatbotApp = workflow.compile({ checkpointer: memory });
   
    return await chatbotApp.invoke({ messages: input }, config)

 
}


module.exports = {
    callChatStream
};