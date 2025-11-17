import { useState } from 'react';
import { Send, Copy, Check, Code, Terminal } from 'lucide-react';
import { api } from '../utils/api';
import type { ExecuteResponse } from '../types';

export function ApiPlayground() {
  const [task, setTask] = useState('');
  const [provider, setProvider] = useState('continue');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ExecuteResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const providers = ['continue', 'alibaba', 'kimi', 'codestral', 'mistral', 'deepseek'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.trim()) return;

    setLoading(true);
    setResponse(null);

    try {
      const result = await api.execute({ task, provider });
      setResponse(result);
    } catch (error) {
      setResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Request failed',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    const curlCommand = `curl -X POST ${window.location.origin}/api/agent4/execute \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({ task, provider }, null, 2)}'`;

    navigator.clipboard.writeText(curlCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header - Mobile Responsive */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Terminal className="w-6 h-6 sm:w-8 sm:h-8 text-primary-400" />
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl sm:text-3xl font-bold">API Playground</h2>
            <p className="text-sm sm:text-base text-gray-400">Test the Agent4 API interactively</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Panel - Mobile Responsive */}
        <div className="card">
          <h3 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
            <Code className="w-5 h-5" />
            Request
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Task Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Task Description
              </label>
              <textarea
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="Enter your task here... (e.g., 'Write a hello world function in Python')"
                className="w-full px-4 py-3 glass rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none text-sm sm:text-base"
                rows={6}
                required
              />
            </div>

            {/* Provider Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                LLM Provider
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full px-4 py-3 glass rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none text-sm sm:text-base"
              >
                {providers.map((p) => (
                  <option key={p} value={p} className="bg-gray-800">
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons - Mobile Responsive */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={loading || !task.trim()}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Send Request</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={copyToClipboard}
                className="btn-secondary flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    <span className="hidden sm:inline">Copy cURL</span>
                    <span className="sm:hidden">Copy</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* cURL Example - Mobile Responsive */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-sm font-medium text-gray-400 mb-2">Example cURL command:</p>
            <pre className="glass p-3 sm:p-4 rounded-lg text-xs sm:text-sm overflow-x-auto">
              <code className="text-gray-300">
{`curl -X POST /api/agent4/execute \\
  -H "Content-Type: application/json" \\
  -d '{"task": "Your task", "provider": "continue"}'`}
              </code>
            </pre>
          </div>
        </div>

        {/* Response Panel - Mobile Responsive */}
        <div className="card">
          <h3 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            Response
          </h3>

          {!response ? (
            <div className="h-64 sm:h-96 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Code className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 opacity-30" />
                <p className="text-sm sm:text-base">Response will appear here</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Status Badge */}
              <div className={`status-badge ${response.success ? 'status-healthy' : 'status-unhealthy'}`}>
                <div className={`w-2 h-2 rounded-full ${response.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>{response.success ? 'Success' : 'Error'}</span>
              </div>

              {/* Response Data - Mobile Responsive */}
              <div className="glass p-4 rounded-lg overflow-x-auto">
                <pre className="text-xs sm:text-sm text-gray-300">
                  <code>{JSON.stringify(response, null, 2)}</code>
                </pre>
              </div>

              {/* Metadata - Mobile Responsive */}
              {response.provider && (
                <div className="text-xs sm:text-sm text-gray-400">
                  Provider: <span className="text-primary-400">{response.provider}</span>
                </div>
              )}
              {response.duration && (
                <div className="text-xs sm:text-sm text-gray-400">
                  Duration: <span className="text-primary-400">{response.duration}ms</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
