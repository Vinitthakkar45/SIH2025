import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-8">
      <main className="flex flex-col items-center text-center max-w-2xl">
        {/* Logo */}
        <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center mb-8 shadow-lg">
          <span className="text-5xl">💧</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          INGRES AI
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
          India&apos;s Groundwater Resource Information System
        </p>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">
          An AI-powered assistant for exploring groundwater data across India.
          Query state reports, compare regions, and analyze extraction levels.
        </p>

        {/* CTA Button */}
        <Link
          href="/chat"
          className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-full hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
        >
          Start Chatting →
        </Link>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <div className="text-3xl mb-3">🗺️</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              State-wise Data
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Access groundwater reports for all Indian states and union territories
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Block-level Analysis
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Drill down to individual blocks with detailed extraction metrics
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <div className="text-3xl mb-3">🤖</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              AI-Powered
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Natural language queries powered by local embeddings and Groq LLM
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
