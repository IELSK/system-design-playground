import { useEffect, useState } from "react";
import api from "./services/api";

function App() {
  const [health, setHealth] = useState<{ status: string; version: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/health")
      .then((res) => setHealth(res.data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">System Design Playground</h1>
        {health ? (
          <p className="text-green-400">
            Backend: {health.status} · v{health.version}
          </p>
        ) : error ? (
          <p className="text-red-400">Erro: {error}</p>
        ) : (
          <p className="text-gray-500">Conectando ao backend...</p>
        )}
      </div>
    </div>
  );
}

export default App;
