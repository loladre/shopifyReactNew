import React, { useState, useEffect, useRef } from "react";
import { Wifi, WifiOff, MessageCircle } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { nanoid } from "nanoid";

interface Message {
  id: string;
  content: string;
  isError: boolean;
  timestamp: Date;
}

interface ServerMessagePanelProps {
  className?: string;
}

export default function ServerMessagePanel({ className = "" }: ServerMessagePanelProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    socketRef.current = io(apiBaseUrl);

    const socket = socketRef.current;

    socket.on("connect", () => {
      setIsConnected(true);
      addMessage("Connected to Server", false);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      addMessage("Disconnected from Server", true);
    });

    socket.on("message", (messageContent: string, contentError?: string) => {
      addMessage(messageContent, contentError === "error");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (content: string, isError: boolean) => {
    const newMessage: Message = {
      id: nanoid(),
      content,
      isError,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 h-full flex flex-col ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <Wifi className="w-5 h-5 text-green-500" />
          ) : (
            <WifiOff className="w-5 h-5 text-red-500" />
          )}
          <h3 className="font-semibold text-slate-900">Server Messages</h3>
        </div>
        <button
          onClick={clearMessages}
          className="text-xs text-slate-500 hover:text-slate-700 transition-colors duration-200"
        >
          Clear
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-2 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <MessageCircle className="w-8 h-8 mb-2" />
            <p className="text-sm">No messages yet</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`p-3 rounded-lg text-sm ${
                message.isError
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-slate-50 text-slate-700 border border-slate-200"
              }`}
            >
              <div className="flex justify-between items-start">
                <p className="flex-1">{message.content}</p>
                <span className="text-xs text-slate-500 ml-2 flex-shrink-0">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
