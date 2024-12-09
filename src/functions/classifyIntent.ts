import llm from "./llm";
import stringSimilarity from "string-similarity";
import {
    ChatPromptTemplate,
} from "@langchain/core/prompts";
import { StringOutputParser} from "@langchain/core/output_parsers"

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
    const chain = prompt.pipe(llm).pipe(outputParser);

    return await chain.invoke({
        query
    });
  }

export const matchIntent = async(query: string) => { 
    const intents = {
        "trade history": "trade history",
        "crypto market": "crypto market",
    };

    const keys = Object.keys(intents);
    const match = stringSimilarity.findBestMatch(query, keys);
    return match.bestMatch.rating > 0.5 ? intents[match.bestMatch.target as keyof typeof intents] : "general";
 }

  module.exports = {
    classifyIntent,
    matchIntent
  }