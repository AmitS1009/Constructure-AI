import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Bot, User, FileText, Loader2, Plus, MessageSquare, Trash2 } from 'lucide-react';
import { ingestFiles } from '../api';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Chat = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am Project Brain. Upload some construction documents or ask me a question about the project.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Persistence & History
  const [threads, setThreads] = useState([]);
  const [currentThreadId, setCurrentThreadId] = useState(null);
  const { token } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    try {
      const res = await axios.get(`${API_URL}/threads`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setThreads(res.data);
    } catch (err) {
      console.error("Failed to fetch threads", err);
    }
  };

  const loadThread = async (threadId) => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_URL}/threads/${threadId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // Map DB messages to UI format
      const uiMessages = res.data.map(msg => ({
        role: msg.role,
        content: msg.content,
        sources: msg.sources
      }));
      setMessages(uiMessages);
      setCurrentThreadId(threadId);
    } catch (err) {
      console.error("Failed to load thread", err);
    }
    setIsLoading(false);
  };

  const createNewChat = () => {
    setMessages([{ role: 'assistant', content: 'Hello! I am Project Brain. Upload some construction documents or ask me a question about the project.' }]);
    setCurrentThreadId(null);
  };

  const deleteThread = async (e, threadId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this chat?")) return;

    try {
      await axios.delete(`${API_URL}/threads/${threadId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // Optimistic update
      setThreads(prev => prev.filter(t => t.id !== threadId));

      // If we deleted the current thread, reset view
      if (currentThreadId === threadId) {
        createNewChat();
      }

      // Fetch latest to be sure
      fetchThreads();
    } catch (err) {
      console.error("Failed to delete thread", err);
      alert("Failed to delete thread. Please try again.");
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files);
    }
  };

  const handleUpload = async (fileList) => {
    setIsUploading(true);
    try {
      const result = await ingestFiles(fileList, currentThreadId);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Successfully processed ${result.chunks_count} chunks from ${result.documents.length} files.`
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error uploading files.' }]);
    }
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Use fetch for streaming
      const response = await fetch(`${API_URL}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question: userMessage.content,
          history: messages.map(m => ({ role: m.role, content: m.content })), // Send simplified history
          thread_id: currentThreadId
        })
      });

      if (!response.ok) throw new Error(response.statusText);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let assistantMessage = { role: 'assistant', content: '', sources: [] };
      setMessages(prev => [...prev, assistantMessage]);

      let buffer = '';
      let isSources = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Check for Thread ID
        if (buffer.includes('__THREAD_ID__:')) {
          const match = buffer.match(/__THREAD_ID__:(\d+)\n\n/);
          if (match) {
            const newThreadId = parseInt(match[1]);
            if (!currentThreadId) {
              setCurrentThreadId(newThreadId);
              fetchThreads(); // Refresh list
            }
            buffer = buffer.replace(match[0], '');
          }
        }

        // Check for Sources
        if (buffer.includes('\n\n__SOURCES__\n')) {
          const parts = buffer.split('\n\n__SOURCES__\n');
          assistantMessage.content += parts[0];
          buffer = parts[1] || ''; // Remaining buffer is sources JSON
          isSources = true;
        } else if (isSources) {
          // Accumulating sources JSON
        } else {
          // Normal text
          assistantMessage.content += buffer;
          buffer = '';
        }

        // Update UI
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { ...assistantMessage };
          return newMessages;
        });
      }

      // Parse sources if present
      if (isSources && buffer) {
        try {
          const sources = JSON.parse(buffer);
          assistantMessage.sources = sources;
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = { ...assistantMessage };
            return newMessages;
          });
        } catch (e) {
          console.error("Failed to parse sources", e);
        }
      }

    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error processing your request.' }]);
    }

    setIsLoading(false);
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 bg-brand-secondary/30 border-r border-white/10 flex flex-col">
        <div className="p-4">
          <button
            onClick={createNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-brand-accent text-white rounded hover:bg-opacity-90 transition-colors"
          >
            <Plus size={18} /> New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {threads.map(thread => (
            <div
              key={thread.id}
              onClick={() => loadThread(thread.id)}
              className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex items-center justify-between gap-2 text-sm group cursor-pointer ${currentThreadId === thread.id ? 'bg-white/10 text-brand-accent' : 'text-brand-muted'}`}
            >
              <div className="flex items-center gap-2 truncate overflow-hidden">
                <MessageSquare size={16} className="flex-shrink-0" />
                <span className="truncate">{thread.title}</span>
              </div>
              <button
                onClick={(e) => deleteThread(e, thread.id)}
                className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity p-1 flex-shrink-0"
                title="Delete Chat"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col h-full relative min-h-0">
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-brand-secondary scrollbar-track-transparent min-h-0">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'user'
                ? 'bg-brand-accent text-white rounded-br-none'
                : 'bg-brand-card border border-white/10 text-brand-text rounded-bl-none shadow-lg backdrop-blur-sm'
                }`}>
                <div className="flex items-center gap-2 mb-1 opacity-70 text-xs">
                  {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                  <span className="capitalize">{msg.role}</span>
                </div>
                <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>

                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/10">
                    <p className="text-xs font-semibold mb-2 text-brand-muted flex items-center gap-1">
                      <FileText size={12} /> Sources:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {msg.sources.map((source, i) => (
                        <div key={i} className="text-xs bg-brand-secondary/50 px-2 py-1 rounded border border-white/5 text-brand-text/80" title={source.text}>
                          {source.doc_name} (p. {source.page_num})
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && !messages[messages.length - 1].content && (
            <div className="flex justify-start">
              <div className="bg-brand-card border border-white/10 p-4 rounded-2xl rounded-bl-none flex items-center gap-2 text-brand-muted">
                <Loader2 className="animate-spin" size={16} />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-brand-dark/50 backdrop-blur-md border-t border-white/10">
          <div className="max-w-4xl mx-auto relative flex items-center gap-2">
            <input
              type="file"
              multiple
              accept=".pdf"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-brand-muted hover:text-brand-accent hover:bg-white/5 rounded-full transition-all"
              title="Upload PDF"
              disabled={isUploading}
            >
              {isUploading ? <Loader2 className="animate-spin" size={20} /> : <Paperclip size={20} />}
            </button>

            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about the project..."
                className="w-full bg-brand-card/50 border border-white/10 text-brand-text rounded-full py-3 px-6 pr-12 focus:outline-none focus:border-brand-accent/50 focus:ring-1 focus:ring-brand-accent/50 placeholder-brand-muted/50 shadow-inner"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-brand-accent text-white rounded-full hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-brand-accent/25"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
          <div className="text-center mt-2">
            <p className="text-xs text-brand-muted/50">
              Project Brain can make mistakes. Verify important information from source documents.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
