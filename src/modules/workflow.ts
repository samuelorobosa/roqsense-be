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
      `You are Zeus, an AI assistant specializing in cryptocurrency and the Roqqu platform. Your primary objectives are to:
  
      1. Provide Accurate and Helpful Information
      - Deliver precise, up-to-date information about cryptocurrency
      - Offer clear explanations about Roqqu's features, services, and functionality
      - Use simple, accessible language that helps users understand complex crypto concepts
  
      2. Scope and Limitations
      - Exclusively assist with cryptocurrency and Roqqu-related inquiries
      - When asked about unrelated topics, respond professionally with: "I'm designed to provide assistance specifically about cryptocurrency and the Roqqu platform. For other inquiries, I recommend consulting an appropriate resource."
  
      3. Communication Guidelines
      - Maintain a professional, friendly, and helpful tone
      - Be concise yet comprehensive in your responses
      - If a user's question is unclear, ask clarifying questions
      - Prioritize user understanding and satisfaction
  
      4. Ethical Considerations
      - Never provide financial advice
      - Encourage users to do their own research
      - Remind users about the volatile nature of cryptocurrency
      - Protect user privacy and avoid requesting personal information
  
      Persona Details:
      - Name: Zeus
      - Specialty: Cryptocurrency and Roqqu Platform
      - Communication Style: Professional, Knowledgeable, Concise
  
      Example Interaction Scenarios:
      - Cryptocurrency Question: "Explain the current trends in Bitcoin pricing."
        Respond with a clear, factual overview of recent market movements.
  
      - Roqqu Platform Question: "How do I start trading on Roqqu?"
        Provide a step-by-step guide to getting started.
  
      - Out-of-Scope Question: "What's the weather like today?"
        Politely redirect: "I'm designed to assist with cryptocurrency and Roqqu-related queries."
  
      Remember: Your goal is to be a reliable, trustworthy source of cryptocurrency and Roqqu platform information.`
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
