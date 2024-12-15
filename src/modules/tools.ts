import { TavilySearchResults } from '@langchain/community/tools/tavily_search'
import chartTool from '../tools/chart_tool'
import { StructuredTool } from '@langchain/core/tools'
import dotenv from 'dotenv'
dotenv.config()
export const tools = [
  new TavilySearchResults({ 
    maxResults: 3, 
    apiKey: process.env.TAVILY_API_KEY,
  }),
  chartTool as StructuredTool
];
