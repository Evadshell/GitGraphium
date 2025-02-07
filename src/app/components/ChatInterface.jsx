import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Paperclip, Bot, User, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const ChatInterface = () => {
  const [messages, setMessages] = useState([
    {
      role: "system",
      content: "Welcome! I'm your AI assistant for exploring and understanding your codebase. How can I help you today?",
      timestamp: new Date().toISOString()
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (input.trim()) {
      const userMessage = {
        role: "user",
        content: input.trim(),
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, userMessage]);
      setInput("");
      setIsTyping(true);

      try {
        const response = await fetch('http://localhost:8000/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: input.trim() })
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        
        const aiMessage = {
          role: "system",
          content: data.response,
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, aiMessage]);
      } catch (error) {
        const errorMessage = {
          role: "system",
          content: "Sorry, I encountered an error while processing your request. Please try again.",
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
      }
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="flex flex-col h-full bg-background border-border rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">AI Assistant</h2>
            <p className="text-sm text-muted-foreground">Exploring your codebase</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="hover:bg-secondary">
          <Sparkles size={20} className="text-primary" />
        </Button>
      </div>
      
      <ScrollArea className="flex-grow p-6 space-y-6 custom-scrollbar" ref={scrollAreaRef}>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 message-in ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.role === "system" && (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot size={20} className="text-primary" />
              </div>
            )}
            
            <div className={`max-w-[80%] space-y-1 ${message.role === "user" ? "items-end" : "items-start"}`}>
              <div
                className={`rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground ml-auto"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
              </div>
              <span className="text-xs text-muted-foreground px-2">
                {formatTime(message.timestamp)}
              </span>
            </div>

            {message.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User size={20} className="text-primary" />
              </div>
            )}
          </div>
        ))}
        
        {isTyping && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Bot size={20} />
            <div className="flex gap-1">
              <span className="animate-bounce">●</span>
              <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>●</span>
              <span className="animate-bounce" style={{ animationDelay: "0.4s" }}>●</span>
            </div>
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <Paperclip size={20} />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about your code..."
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            className="flex-grow bg-secondary border-transparent text-foreground placeholder:text-muted-foreground focus:border-primary"
          />
          <Button
            onClick={handleSend}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            size="icon"
          >
            <Send size={20} />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ChatInterface;