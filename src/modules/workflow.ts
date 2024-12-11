import {
  MemorySaver,
  MessagesAnnotation,
  StateGraph
} from '@langchain/langgraph'
import { model } from './llm'
import {
  ChatPromptTemplate,
  MessagesPlaceholder
} from '@langchain/core/prompts'
import { tools } from './tools'
import { ToolNode } from '@langchain/langgraph/prebuilt'
import { HumanMessage } from '@langchain/core/messages'

// Initialize memory to persist state between graph runs
const agentCheckpointer = new MemorySaver()

export const workflow = async (message: string, config: any, promptArgs?: any) => {
  // Define the tools for the agent to use
  const toolNode = new ToolNode(tools)

  const prompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      `
        You are Zeus, an AI chatbot designed to answer only questions related to cryptocurrency and Roqqu. Roqqu is a platform for buying, selling, and managing cryptocurrency. You are polite, knowledgeable, and concise. If a user asks a question unrelated to cryptocurrency or Roqqu, politely decline to answer and remind them of your purpose.

        For example:
        - If asked about cryptocurrency, provide expert insights or factual information.
        - If asked about Roqqu, explain its features and use cases.
        - If asked about anything else (e.g., sports, weather, random topics), respond with: "I'm sorry, but I can only assist with questions about cryptocurrency and Roqqu."

        Always address users respectfully and refer to yourself as Zeus.`
    ],
    new MessagesPlaceholder('messages')
  ])

  function shouldContinue({ messages }: typeof MessagesAnnotation.State) {
    const lastMessage = messages[messages.length - 1]

    // If the LLM makes a tool call, then we route to the "tools" node
    if (lastMessage.additional_kwargs.tool_calls) {
      return 'tools'
    }
    // Otherwise, we stop (reply to the user) using the special "__end__" node
    return '__end__'
  }

  async function callModel(state: typeof MessagesAnnotation.State) {
    const chain = promptArgs? promptArgs.pipe(model) : prompt.pipe(model)
    const response = await chain.invoke(state)
    // We return a list, because this will get added to the existing list
    return { messages: [response] }
  }

  const workflow = new StateGraph(MessagesAnnotation)
    .addNode('agent', callModel)
    .addEdge('__start__', 'agent') // __start__ is a special name for the entrypoint
    .addNode('tools', toolNode)
    .addEdge('tools', 'agent')
    .addConditionalEdges('agent', shouldContinue)

  // Finally, we compile it into a LangChain Runnable.
  const zeus = workflow.compile({ checkpointer: agentCheckpointer })

  // Now it's time to use!
  return await zeus.invoke(
    { messages: [new HumanMessage(message)] },
    config
  )
}
