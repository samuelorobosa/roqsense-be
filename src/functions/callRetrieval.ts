import llm from "./llm";
import {
    ChatPromptTemplate,
    MessagesPlaceholder,
} from "@langchain/core/prompts";
import {createStuffDocumentsChain} from "langchain/chains/combine_documents"
import {CheerioWebBaseLoader} from "@langchain/community/document_loaders/web/cheerio"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import { OpenAIEmbeddings } from '@langchain/openai';
import { MemoryVectorStore } from "langchain/vectorstores/memory"
import { createHistoryAwareRetriever} from "langchain/chains/history_aware_retriever"
import {createRetrievalChain} from "langchain/chains/retrieval"


const createVectorStore = async (webpage: string) => {
    // Load data from webpage
    const loader = new CheerioWebBaseLoader(webpage);
    const docs = await loader.load();

    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 200,
        chunkOverlap: 20
    })

    const splitDocs = await splitter.splitDocuments(docs);
    const embeddings = new OpenAIEmbeddings(); 

    // Save to vector store
    const vectorstore = await MemoryVectorStore.fromDocuments(splitDocs, embeddings);
    return vectorstore;
}


export const callRetrieval = async (message: string) => {
    const prompt = ChatPromptTemplate.fromTemplate(`
        Answer the users question
        Context: {context}
        Question: {input}
    `)

    // const chain = prompt.pipe(llm);
    const chain = await createStuffDocumentsChain({
        llm, prompt
    })

    const vectorstore = await createVectorStore("https://js.langchain.com/docs/integrations/document_loaders/web_loaders/web_cheerio/")

    // Retrieve data from vector store
    const retriever = vectorstore.asRetriever({
        k: 2
    });

    const retrieverPrompt = ChatPromptTemplate.fromMessages([
        new MessagesPlaceholder("chat_history"),
        ["user", "{input}"],
        [
            "user",
            "Given the above conversation, generate a search query to look up in order to get information relevant to the conversation",
        ],
    ])

    const historyAwareRetrieval = await createHistoryAwareRetriever({
        llm,
        retriever,
        rephrasePrompt: retrieverPrompt
    })

    const retrievalChain = await createRetrievalChain({
        combineDocsChain: chain,
        retriever: historyAwareRetrieval
    })

    return await retrievalChain.invoke({
        input: message,
    });
 }

 module.exports = {
    callRetrieval
 }
