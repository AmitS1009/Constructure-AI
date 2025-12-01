import React, { useState } from 'react';
import Layout from '../components/Layout';
import { extractDoorSchedule } from '../api';
import { Loader2, Table as TableIcon, FileText } from 'lucide-react';

const Extraction = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleExtract = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await extractDoorSchedule();
      setData(result.data || []);
    } catch (err) {
      console.error("Extraction error:", err);
      setError("Failed to extract data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex-1 flex flex-col h-full p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto w-full">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">Door Schedule</h1>
              <p className="text-gray-400 text-lg">Automatically extract door specifications from project documents.</p>
            </div>
            
            <button
              onClick={handleExtract}
              disabled={isLoading}
              className="flex items-center gap-3 bg-brand-accent hover:bg-brand-accent/90 text-white px-8 py-4 rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-accent/20 hover:scale-105 active:scale-95"
            >
              {isLoading ? <Loader2 className="animate-spin" size={24} /> : <TableIcon size={24} />}
              {isLoading ? 'Extracting...' : 'Generate Schedule'}
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-6 rounded-2xl mb-8 backdrop-blur-sm">
              {error}
            </div>
          )}

          {data.length > 0 ? (
            <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden backdrop-blur-md shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="bg-black/20 text-gray-400 uppercase font-bold tracking-wider text-xs">
                    <tr>
                      <th className="px-8 py-6">Mark</th>
                      <th className="px-8 py-6">Location</th>
                      <th className="px-8 py-6">Width (mm)</th>
                      <th className="px-8 py-6">Height (mm)</th>
                      <th className="px-8 py-6">Fire Rating</th>
                      <th className="px-8 py-6">Material</th>
                      <th className="px-8 py-6">Sources</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {data.map((item, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="px-8 py-5 font-bold text-white">{item.mark || '-'}</td>
                        <td className="px-8 py-5">{item.location || '-'}</td>
                        <td className="px-8 py-5 font-mono text-brand-accent">{item.width_mm || '-'}</td>
                        <td className="px-8 py-5 font-mono text-brand-accent">{item.height_mm || '-'}</td>
                        <td className="px-8 py-5">
                          {item.fire_rating ? (
                            <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded text-xs border border-red-500/30 font-medium">
                              {item.fire_rating}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-8 py-5">{item.material || '-'}</td>
                        <td className="px-8 py-5">
                          {item.source_references && item.source_references.length > 0 ? (
                            <div className="flex flex-col gap-2">
                              {item.source_references.map((ref, rIdx) => (
                                <span key={rIdx} className="inline-flex items-center gap-1.5 text-xs text-blue-300 bg-blue-500/10 px-2.5 py-1.5 rounded-lg border border-blue-500/20 hover:bg-blue-500/20 transition-colors cursor-help" title={ref.excerpt}>
                                  <FileText size={12} />
                                  {ref.file}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-600">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            !isLoading && (
              <div className="text-center py-32 bg-white/5 rounded-3xl border border-white/10 border-dashed backdrop-blur-sm">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                  <TableIcon size={40} className="text-gray-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">No data extracted yet</h3>
                <p className="text-gray-400 max-w-md mx-auto">Click the button above to analyze documents and generate the door schedule automatically.</p>
              </div>
            )
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Extraction;
