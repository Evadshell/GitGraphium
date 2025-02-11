import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const ChatInterface = () => {
  const [messages, setMessages] = useState([
    {
      role: "system",
      content: "How can I help you explore and understand your codebase today?",
      timestamp: new Date().toISOString()
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const scrollAreaRef = useRef(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current;
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: input.trim() 
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to get response');
      }

      const aiMessage = {
        role: "system",
        content: data.response || "I couldn't process that request. Please try again.",
        context: data.context,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setError(error.message);
      
      const errorMessage = {
        role: "system",
        content: `Error: ${error.message}. Please try again or check if the server is running.`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="flex flex-col h-full bg-black border-neutral-800 rounded-xl overflow-hidden">
      <div className="px-6 py-3 border-b border-neutral-800 bg-neutral-900/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-white">AI Assistant</h2>
            <p className="text-xs text-neutral-400">Code Explorer</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-grow px-4 py-6 space-y-6 bg-black" ref={scrollAreaRef}>
        {messages.map((message, index) => (
          <div
            key={`${message.timestamp}-${index}`}
            className={`flex items-start gap-3 ${
              message.role === "user" ? "justify-end" : "justify-start"
            } mb-6`}
          >
            {message.role === "system" && (
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                <Bot size={16} className="text-white" />
              </div>
            )}
            
            <div className={`max-w-[70%] space-y-1 ${message.role === "user" ? "items-end" : "items-start"}`}>
              <div
                className={`rounded-2xl px-4 py-2.5 ${
                  message.role === "user"
                    ? "bg-white text-black"
                    : "bg-neutral-900 text-white border border-neutral-800"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                {message.context && message.context.relevant_function && (
                  <div className="mt-2 pt-2 border-t border-neutral-800 text-xs">
                    <p className="font-medium text-neutral-300">Related Function: 
                      <span className="text-white ml-1">{message.context.relevant_function.name}</span>
                    </p>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-neutral-500 px-1">
                {formatTime(message.timestamp)}
              </span>
            </div>

            {message.role === "user" && (
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                <User size={16} className="text-white" />
              </div>
            )}
          </div>
        ))}
        
        {isTyping && (
          <div className="flex items-center gap-2 text-neutral-400">
            <Bot size={16} />
            <div className="flex gap-1">
              <span className="animate-bounce">●</span>
              <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>●</span>
              <span className="animate-bounce" style={{ animationDelay: "0.4s" }}>●</span>
            </div>
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t border-neutral-800 bg-black">
        {error && (
          <div className="mb-2 text-xs text-red-400">
            {error}
          </div>
        )}
        <div className="flex gap-2 items-center">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Message..."
            className="flex-grow bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500 text-sm rounded-xl focus-visible:ring-white focus-visible:ring-1"
          />
          <Button
            onClick={handleSend}
            className="bg-white hover:bg-neutral-200 text-black rounded-xl"
            size="icon"
            disabled={isTyping || !input.trim()}
          >
            <Send size={16} />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ChatInterface;