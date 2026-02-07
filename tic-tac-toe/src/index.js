import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { TamboProvider, useTamboThread, useTamboThreadInput } from "@tambo-ai/react";
import calculateWinner from './helpers/calculateWinner'
import Board from './components/board/Board'
import GameInfo from './components/game-info/GameInfo'

const PROJECT_CONTEXT_ENDPOINT = `${process.env.PUBLIC_URL || ""}/project-context.json`;

let projectContextPromise;

function getFallbackProjectContext() {
  return {
    generatedAt: null,
    summary: "No local project context is available.",
    resources: [],
  };
}

async function loadProjectContext() {
  if (!projectContextPromise) {
    projectContextPromise = fetch(PROJECT_CONTEXT_ENDPOINT)
      .then((response) => {
        if (!response.ok) throw new Error("project context not found");
        return response.json();
      })
      .catch(() => getFallbackProjectContext());
  }
  return projectContextPromise;
}

async function listProjectResources(search) {
  const context = await loadProjectContext();
  const query = (search || "").toLowerCase().trim();

  return context.resources
    .filter((resource) => {
      if (!query) return true;
      return (
        resource.uri.toLowerCase().includes(query) ||
        resource.path.toLowerCase().includes(query) ||
        resource.name.toLowerCase().includes(query)
      );
    })
    .map((resource) => ({
      uri: resource.uri,
      name: resource.name,
      description: `Project file ${resource.path}`,
      mimeType: resource.mimeType,
    }));
}

async function getProjectResource(uri) {
  const context = await loadProjectContext();
  const resource = context.resources.find((item) => item.uri === uri);

  if (!resource) {
    return {
      contents: [
        {
          uri,
          mimeType: "text/plain",
          text: `Resource not found for uri: ${uri}`,
        },
      ],
    };
  }

  return {
    contents: [
      {
        uri: resource.uri,
        mimeType: resource.mimeType || "text/plain",
        text: resource.text,
      },
    ],
  };
}

function getMessageText(content) {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return String(content);

  return content
    .map((part) => {
      if (!part || typeof part !== "object") return "";
      if (part.type === "text" && typeof part.text === "string") return part.text;
      return "";
    })
    .join("\n");
}

function ChatInterface() {
  const { thread, streaming } = useTamboThread();
  const { value, setValue, submit, isPending, error } = useTamboThreadInput();
  const hasApiKey = Boolean(process.env.REACT_APP_TAMBO_API_KEY || process.env.NEXT_PUBLIC_TAMBO_API_KEY);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!value.trim() || isPending) return;
    await submit();
  };

  return (
    <main style={{ maxWidth: 760, margin: "2rem auto", padding: "0 1rem" }}>
      <h1>Tambo Chat</h1>
      <p>Ask anything to test your Tambo setup.</p>
      {!hasApiKey && (
        <p style={{ color: "crimson" }}>
          Missing API key. Set REACT_APP_TAMBO_API_KEY in .env.local and restart the dev server.
        </p>
      )}

      <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, minHeight: 360 }}>
        {thread.messages.length === 0 ? (
          <p style={{ color: "#666" }}>No messages yet. Send your first prompt.</p>
        ) : (
          thread.messages.map((message) => (
            <article key={message.id} style={{ marginBottom: 12 }}>
              <strong style={{ textTransform: "capitalize" }}>{message.role}</strong>
              <p style={{ whiteSpace: "pre-wrap", margin: "0.4rem 0" }}>{getMessageText(message.content)}</p>
              {message.renderedComponent}
            </article>
          ))
        )}
      </section>

      <form onSubmit={onSubmit} style={{ marginTop: 12, display: "grid", gap: 8 }}>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type a message..."
          rows={4}
          style={{ width: "100%", padding: 10 }}
        />
        <button type="submit" disabled={isPending} style={{ width: 120, padding: "8px 12px" }}>
          {isPending ? "Sending..." : "Send"}
        </button>
      </form>

      {streaming && <p>Generating response...</p>}
      {error && <p style={{ color: "crimson" }}>{error.message || "Failed to send message"}</p>}
    </main>
  );
}

function ChatPage() {
  return (
    <TamboProvider
      apiKey={process.env.REACT_APP_TAMBO_API_KEY || process.env.NEXT_PUBLIC_TAMBO_API_KEY || ""}
      listResources={listProjectResources}
      getResource={getProjectResource}
      contextHelpers={{
        project_summary: async () => {
          const context = await loadProjectContext();
          return context.summary;
        },
        assistant_instructions: async () => {
          return "Use project resources before answering codebase questions. If information is missing, ask for the exact file path.";
        },
        project_context_version: async () => {
          const context = await loadProjectContext();
          return {
            generatedAt: context.generatedAt,
            resourceCount: context.resources.length,
          };
        },
      }}
    >
      <ChatInterface />
    </TamboProvider>
  );
}

class Game extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      history: [
        {
          squares: Array(9).fill(null),
        },
      ],
      stepNumber: 0,
      xIsNext: true,
    }
  }

  handleClick(i) {
    const history = this.state.history.slice(0, this.state.stepNumber + 1)
    const current = history[history.length - 1]
    const squares = current.squares.slice()
    if (calculateWinner(squares) || squares[i]) {
      return
    }
    squares[i] = this.state.xIsNext ? 'X' : 'O'
    this.setState({
      history: history.concat([
        {
          squares: squares,
        },
      ]),
      stepNumber: history.length,
      xIsNext: !this.state.xIsNext,
    })
  }

  jumpTo(step) {
    console.log(step)
    this.setState({
      stepNumber: step,
      xIsNext: step % 2 === 0,
    })
  }

  render() {
    const history = this.state.history
    const current = history[this.state.stepNumber]
    const winner = calculateWinner(current.squares)
    let status
    if (winner) {
      status = 'Winner: ' + winner
    } else {
      status = 'Next player: ' + (this.state.xIsNext ? 'X' : 'O')
    }
    return (
      <React.Fragment>
        <h1>Tic Tac Toe</h1>
        <section className="game">
          <GameInfo
            status={status}
            winner={winner}
            xIsNext={this.state.xIsNext}
          />
          <Board
            squares={current.squares}
            onClick={(i) => this.handleClick(i)}
            jumpTo={(i) => this.jumpTo(i)}
          />
        </section>
      </React.Fragment>
    )
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <Router basename={process.env.REACT_APP_URI || "/"}>
    <Routes>
      <Route path="/" element={<ChatPage />} />
      <Route path="/tic-tac-toe" element={<Game />} />
    </Routes>
  </Router>
)
