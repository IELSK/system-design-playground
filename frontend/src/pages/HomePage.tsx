import { useAuth } from "../hooks/useAuth";

export default function HomePage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">System Design Playground</h1>
        <p className="text-gray-400">
          Welcome, <span className="text-white font-medium">{user?.name}</span>
        </p>
        <button
          onClick={logout}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-md text-sm transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
