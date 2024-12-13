import {
  ChatPromptTemplate,
} from "@langchain/core/prompts";
import { StringOutputParser} from "@langchain/core/output_parsers"
import model from './fn-llm'

export const classifyIntent = async(query: string) => {
  const prompt = ChatPromptTemplate.fromTemplate(`
    Classify the following query into one of these intents:
      - "trade history": inquiries about user balance and trade history on Roqqu
      - "crypto asset": inquiries about a specific crypto asset
      - "roqqu": inquiries about Roqqu as a company and it's products,features and services
      - "general"
      Query: {query}
      Return only the intent.
    `)

  const outputParser = new StringOutputParser();
  const chain = prompt.pipe(model).pipe(outputParser);
  return await chain.invoke({
    query
  });
}

module.exports = {
  classifyIntent,
}
