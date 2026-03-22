# RoqSense Backend (roqsense-be)

RoqSense Backend is a Node.js API built with **Express** and **TypeScript**. It serves as an intelligent backend for **Zeus**, an AI assistant specializing in cryptocurrency. The application uses **LangChain** and **LangGraph** to construct cognitive agents, process intents, and stream real-time responses to client applications.

## 🚀 Features

- **AI-Powered Chat Agent ("Zeus")**: Specialized persona optimized to answer queries regarding crypto assets and market data.
- **Intent Classification**: Dynamically routes user queries into specific scopes (`crypto asset`, `trade history`, or `general`).
- **Entity Extraction**: Automatically detects and extracts cryptocurrency names from user inputs, mapping them to standard ticker symbols (e.g., Bitcoin -> BTC).
- **External API Integration**: Connects to the Binance API to fetch live and historical market data for referenced cryptocurrencies.
- **Server-Sent Events (SSE)**: Provides real-time, character-by-character conversational streaming (simulated typing effect) back to the client.
- **Stateful Intelligence**: Remembers conversation states across turn boundaries using LangGraph `MemorySaver` and Thread IDs.

## 🛠 Tech Stack

- **Framework**: Express.js, Node.js
- **Language**: TypeScript
- **AI / LLM Framework**: LangChain ecosystem (`@langchain/core`, `@langchain/langgraph`, `@langchain/openai`, `@langchain/community`)
- **HTTP Client**: Axios (for Binance and external data fetching)
- **Development Tools**: `nodemon`, `ts-node-dev`, `eslint`, `prettier`

## 📦 Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   cd roqsense-be
   ```

2. Install the necessary dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables:
   Create a `.env` file in the root of the project and ensure you provide any required LLM API keys. (For example, if using OpenAI models under the hood):
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

## 🏃 Running the Application

### Development Mode

To start the server using `nodemon` (watches the `src` folder for changes):

```bash
npm run dev
```

Alternatively, you can use `ts-node-dev`:

```bash
npm start
```

### Production Build

To compile the TypeScript code into JavaScript:

```bash
npm run build
```

The server will start locally and listen on **Port 8000**.

## 🔌 API Reference

### 1. **Health Check**
- **Endpoint**: `GET /`
- **Description**: Verifies the server is running.
- **Response**: `Hello World`

### 2. **AI Chat Stream**
- **Endpoint**: `POST /api/v1/chat`
- **Description**: Submits a user query and returns a continuous HTTP Server-Sent Event (SSE) stream simulating typing behavior.
- **Headers Needed**: `Content-Type: application/json`
- **Body Context**:
  ```json
  {
      "message": "Explain the current trends in BTC pricing.",
      "thread_id": "unique-session-id-12345"
  }
  ```
- **Response**: A live SSE connection outputting chunks of characters along with contextual processing statuses (e.g., intent classified, retrieving historical data).

## 🗂 Project Structure

```text
src/
├── app.ts                         # Application entry point, Express setup, and SSE stream logic
├── modules/
│   ├── axios.ts                   # Axios service for Binance API (history, rates)
│   ├── callExtractAssets.ts       # LLM prompt configuration to extract & standardise crypto tokens
│   ├── classifyIntent.ts          # LLM intent detection (Trade History, Asset, General)
│   ├── fn-llm.ts / llm.ts         # LLM model initialisation endpoints
│   ├── tools.ts                   # Export registry for custom tools used by the AI agent
│   └── workflow.ts                # The main LangGraph node/edge configurations and "Zeus" persona
└── tools/
    └── chart_tool.ts              # Agent-accessible tool for executing logic that requires chart generations
```