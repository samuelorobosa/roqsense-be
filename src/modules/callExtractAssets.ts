import { ChatPromptTemplate } from "@langchain/core/prompts";
import {StructuredOutputParser} from "langchain/output_parsers"
import model from './fn-llm'

export const callExtractAsset = async (message: string) => {
  const prompt = ChatPromptTemplate.fromTemplate(`
        Extract information about the asset mentioned in the text.
        Formatting instruction: {format_instruction}

       {phrase}
    `)

  // TODO: Currently not at best performance - improve later
  const outputParser = StructuredOutputParser.fromNamesAndDescriptions({
    asset: "The name of the cryptocurrency asset and save it in the token key e.g BTC, ETH, DOGE",
  });

  const chain = prompt.pipe(model).pipe(outputParser);

  return await chain.invoke({
    phrase: message,
    format_instruction: outputParser.getFormatInstructions()
  });
}


module.exports = {
  callExtractAsset
}
