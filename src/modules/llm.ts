
import { ChatOpenAI } from '@langchain/openai'
import { tools } from './tools'
import dotenv from 'dotenv'
dotenv.config()

export const model = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  // model: "gpt-4o-2024-11-20",
  model: "gpt-4o",
  temperature: 0.7,
}).bindTools(tools);
