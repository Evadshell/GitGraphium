"use client"
import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, AlertCircle, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ChatInterface = ({ theme = 'dark' }) => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "How can I help you explore and understand your codebase today?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const scrollAreaRef = useRef(null);
  const inputRef = useRef(null);

  const bgColor = theme === 'dark' ? 'bg-neutral-900' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-white' : 'text-neutral-900';
  const borderColor = theme === 'dark' ? 'border-neutral-800' : 'border-neutral-200';
  const mutedTextColor = theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500';

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
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input.trim(),
          history: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from server");
      }

      const data = await response.json();

      const assistantMessage = {
        role: "assistant",
        content: data.Assistant.response || "I couldn't process that request. Please try again.",
        timestamp: new Date().toISOString(),
        codeContext: data.codeContext
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={`flex flex-col h-full ${bgColor} rounded-lg overflow-hidden`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b ${borderColor} ${bgColor}`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center`}>
            <Bot size={18} className="text-blue-500" />
          </div>
          <div>
            <h2 className={`text-sm font-medium ${textColor}`}>Code Assistant</h2>
            <p className={`text-xs ${mutedTextColor}`}>Analyzing your codebase</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea 
        ref={scrollAreaRef}
        className="flex-grow px-4 py-4 space-y-4"
      >
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {messages.map((message, index) => (
          <div
            key={`${message.timestamp}-${index}`}
            className={`flex items-start gap-3 ${
              message.role === "user" ? "justify-end" : ""
            } mb-6`}
          >
            {message.role === "assistant" && (
              <div className={`w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0`}>
                <Bot size={16} className="text-blue-500" />
              </div>
            )}

            <div className={`max-w-[80%] space-y-1`}>
              <div
                className={`rounded-2xl px-4 py-2.5 ${
                  message.role === "user"
                    ? "bg-blue-500 text-white"
                    : `${theme === 'dark' ? 'bg-neutral-800' : 'bg-neutral-100'} ${textColor}`
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
                {message.codeContext && (
                  <div className={`mt-2 pt-2 border-t ${borderColor} text-xs`}>
                    <p className={mutedTextColor}>
                      Related code: <span className={textColor}>{message.codeContext}</span>
                    </p>
                  </div>
                )}
              </div>
              <span className={`text-[10px] ${mutedTextColor} px-1`}>
                {formatTime(message.timestamp)}
              </span>
            </div>

            {message.role === "user" && (
              <div className={`w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0`}>
                <User size={16} className="text-blue-500" />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center`}>
              <Loader2 size={16} className="text-blue-500 animate-spin" />
            </div>
            <div className={`px-4 py-2.5 rounded-2xl ${theme === 'dark' ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
              <div className="flex gap-1">
                <span className="animate-bounce">●</span>
                <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>●</span>
                <span className="animate-bounce" style={{ animationDelay: "0.4s" }}>●</span>
              </div>
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className={`p-4 border-t ${borderColor} ${bgColor}`}>
        <div className="flex gap-2 items-center">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask about your code..."
            className={`flex-grow ${theme === 'dark' ? 'bg-neutral-800' : 'bg-neutral-100'} ${textColor} border-0 placeholder:${mutedTextColor} text-sm rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500`}
          />
          <Button
            onClick={handleSend}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl"
            size="icon"
            disabled={isTyping || !input.trim()}
          >
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;