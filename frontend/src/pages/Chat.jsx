import React, { useState, useRef, useEffect } from 'react';
import Layout from '../components/Layout';
import { queryChat, ingestFiles } from '../api';
import { Send, Paperclip, FileText, Loader2, Upload, Bot, User } from 'lucide-react';

const Chat = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am Project Brain. Upload some construction documents or ask me a question about the project.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await queryChat(userMessage.content, history);
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.answer,
        sources: response.sources 
      }]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error processing your request." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const result = await ingestFiles(files);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Successfully ingested ${result.chunks_count} chunks from ${result.documents.length} files.` 
      }]);
    } catch (error) {
      console.error("Error uploading files:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Error uploading files." }]);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Layout>
      <div className="flex-1 flex flex-col h-full">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              
              {msg.role === 'assistant' && (
                <div className="w-10 h-10 rounded-full bg-brand-accent/20 flex items-center justify-center shrink-0 border border-brand-accent/30">
                  <Bot size={20} className="text-brand-accent" />
                </div>
              )}

              <div className={`max-w-3xl rounded-2xl p-6 shadow-xl ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-br from-brand-accent to-pink-600 text-white rounded-tr-none' 
                  : 'bg-white/5 backdrop-blur-md text-gray-100 border border-white/10 rounded-tl-none'
              }`}>
                <div className="whitespace-pre-wrap leading-relaxed text-[15px]">{msg.content}</div>
                
                {/* Citations */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-white/10">
                    <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                      <FileText size={12} /> Sources
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {msg.sources.map((source, sIdx) => (
                        <div key={sIdx} className="flex items-start gap-3 text-xs bg-black/20 p-3 rounded-lg border border-white/5 hover:bg-black/30 transition-colors cursor-default">
                          <div className="mt-0.5 w-1 h-full bg-brand-accent rounded-full"></div>
                          <div>
                            <span className="font-semibold text-brand-accent">{source.doc_name}</span>
                            <span className="text-gray-500 mx-2">•</span>
                            <span className="text-gray-400">Page {source.page_num}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center shrink-0 border border-purple-500/30">
                  <User size={20} className="text-purple-400" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start gap-4">
               <div className="w-10 h-10 rounded-full bg-brand-accent/20 flex items-center justify-center shrink-0 border border-brand-accent/30">
                  <Bot size={20} className="text-brand-accent" />
                </div>
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center gap-3">
                <Loader2 className="animate-spin text-brand-accent" size={20} />
                <span className="text-gray-400 text-sm">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 bg-black/20 backdrop-blur-xl border-t border-white/5">
          <div className="max-w-4xl mx-auto relative">
            <form onSubmit={handleSend} className="flex gap-4 items-end">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="p-4 text-gray-400 hover:text-white hover:bg-white/10 rounded-2xl transition-all disabled:opacity-50 border border-transparent hover:border-white/10"
                title="Upload PDF"
              >
                {isUploading ? <Loader2 className="animate-spin" /> : <Paperclip />}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf"
                multiple
              />
              
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question about the project..."
                  className="w-full bg-white/5 text-white rounded-2xl px-6 py-4 border border-white/10 focus:outline-none focus:border-brand-accent/50 focus:ring-1 focus:ring-brand-accent/50 transition-all placeholder:text-gray-600 shadow-inner"
                />
              </div>
              
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-4 bg-brand-accent text-white rounded-2xl hover:bg-brand-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-accent/20 hover:scale-105 active:scale-95"
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Chat;
