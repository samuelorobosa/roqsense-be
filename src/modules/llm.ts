
import { ChatOpenAI } from '@langchain/openai'
import { tools } from './tools'
import dotenv from 'dotenv'
dotenv.config()

export const model = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  model: "gpt-4o-mini",
  temperature: 0.7,
}).bindTools(tools);
