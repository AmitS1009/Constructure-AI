import React, { useState } from 'react';
import Layout from '../components/Layout';
import { runEvals } from '../api';
import { Loader2, CheckSquare, AlertCircle, CheckCircle2, XCircle, BarChart3 } from 'lucide-react';
import clsx from 'clsx';

const Eval = () => {
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRunEval = async () => {
    setIsLoading(true);
    try {
      const result = await runEvals();
      setReport(result);
    } catch (err) {
      console.error("Eval error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex-1 flex flex-col h-full p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto w-full">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">System Evaluation</h1>
              <p className="text-gray-400 text-lg">Run automated tests to verify RAG pipeline performance.</p>
            </div>
            
            <button
              onClick={handleRunEval}
              disabled={isLoading}
              className="flex items-center gap-3 bg-purple-600 hover:bg-purple-500 text-white px-8 py-4 rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-600/20 hover:scale-105 active:scale-95"
            >
              {isLoading ? <Loader2 className="animate-spin" size={24} /> : <CheckSquare size={24} />}
              {isLoading ? 'Running Tests...' : 'Run Evaluation Suite'}
            </button>
          </div>

          {report && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-md">
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Total Tests</p>
                  <p className="text-5xl font-bold text-white">{report.summary.total}</p>
                </div>
                <div className="bg-green-500/10 p-8 rounded-3xl border border-green-500/20 backdrop-blur-md">
                  <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-4">Passed</p>
                  <p className="text-5xl font-bold text-green-400">{report.summary.passed}</p>
                </div>
                <div className="bg-red-500/10 p-8 rounded-3xl border border-red-500/20 backdrop-blur-md">
                  <p className="text-red-400 text-xs font-bold uppercase tracking-widest mb-4">Failed</p>
                  <p className="text-5xl font-bold text-red-400">{report.summary.failed}</p>
                </div>
                <div className="bg-blue-500/10 p-8 rounded-3xl border border-blue-500/20 backdrop-blur-md">
                  <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-4">Accuracy</p>
                  <p className="text-5xl font-bold text-blue-400">{report.summary.accuracy}</p>
                </div>
              </div>

              {/* Detailed Results */}
              <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden backdrop-blur-md shadow-2xl">
                <div className="p-8 border-b border-white/10 flex items-center gap-3">
                  <BarChart3 className="text-gray-400" />
                  <h3 className="text-xl font-bold text-white">Detailed Results</h3>
                </div>
                <div className="divide-y divide-white/5">
                  {report.details.map((test, idx) => (
                    <div key={idx} className="p-8 hover:bg-white/5 transition-colors">
                      <div className="flex items-start gap-6">
                        <div className="mt-1 shrink-0">
                          {test.status === 'PASS' ? (
                            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
                              <CheckCircle2 className="text-green-400" size={24} />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
                              <XCircle className="text-red-400" size={24} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-4">
                          <div className="flex justify-between items-start">
                            <h4 className="text-xl font-semibold text-white leading-tight">{test.question}</h4>
                            <span className={clsx(
                              "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border",
                              test.status === 'PASS' ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                            )}>
                              {test.status}
                            </span>
                          </div>
                          
                          <div className="bg-black/30 rounded-xl p-6 border border-white/5">
                            <p className="text-gray-300 leading-relaxed">{test.answer}</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                            <div>
                              <span className="text-gray-500 block mb-2 font-medium uppercase tracking-wider text-xs">Expected Keywords</span>
                              <div className="flex flex-wrap gap-2">
                                {test.expected_keywords.map((kw, kIdx) => (
                                  <span key={kIdx} className="bg-white/10 text-gray-300 px-3 py-1.5 rounded-lg border border-white/10">
                                    {kw}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-500 block mb-2 font-medium uppercase tracking-wider text-xs">Found Keywords</span>
                              <div className="flex flex-wrap gap-2">
                                {test.found_keywords.length > 0 ? (
                                  test.found_keywords.map((kw, kIdx) => (
                                    <span key={kIdx} className="bg-green-500/20 text-green-300 px-3 py-1.5 rounded-lg border border-green-500/30">
                                      {kw}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-gray-600 italic px-2">None</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Eval;
