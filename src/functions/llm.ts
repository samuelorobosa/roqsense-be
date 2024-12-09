import { ChatOpenAI } from '@langchain/openai';
import dotenv from 'dotenv';
dotenv.config();

const llm = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model: "gpt-4o-mini",
    temperature: 0.7
});

export default llm;

