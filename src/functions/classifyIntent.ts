import llm from "./llm";
import stringSimilarity from "string-similarity";
import {
    ChatPromptTemplate,
} from "@langchain/core/prompts";

export const classifyIntent = async(query: string) => {
    const prompt = ChatPromptTemplate.fromTemplate(`
    Classify the following query into one of these intents:
      - "trade history"
      - "crypto market"
      - "general"
      Query: {query}
      Return only the intent.
    `)

    const chain = prompt.pipe(llm);

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