import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Send, Plus, Trash2, Volume2, VolumeX, Copy, Check,
  MessageCircle, Sparkles, RotateCcw
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import loadingGif from "@/assets/relymi-loading.gif";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatTab {
  id: string;
  title: string;
  messages: Message[];
}

interface ReLyMiChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuery?: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/relymi-chat`;

const ReLyMiChat = ({ open, onOpenChange, initialQuery }: ReLyMiChatProps) => {
  const [tabs, setTabs] = useState<ChatTab[]>([
    { id: "1", title: "New chat", messages: [] }
  ]);
  const [activeTabId, setActiveTabId] = useState("1");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeTab?.messages]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      // If there's an initial query, set it
      if (initialQuery && activeTab.messages.length === 0) {
        setInput(initialQuery);
      }
    }
  }, [open, initialQuery]);

  const streamChat = useCallback(async (messages: Message[], onDelta: (text: string) => void, onDone: () => void) => {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ 
        messages: messages.map(m => ({ role: m.role, content: m.content }))
      }),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({ error: "Request failed" }));
      throw new Error(errorData.error || `Request failed with status ${resp.status}`);
    }

    if (!resp.body) throw new Error("No response body");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Final flush
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch { /* ignore */ }
      }
    }

    onDone();
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim()
    };

    // Update tab title if first message
    const isFirstMessage = activeTab.messages.length === 0;
    const newTitle = isFirstMessage 
      ? input.trim().slice(0, 30) + (input.trim().length > 30 ? "..." : "")
      : activeTab.title;

    setTabs(prev => prev.map(t => 
      t.id === activeTabId 
        ? { ...t, title: newTitle, messages: [...t.messages, userMessage] }
        : t
    ));
    setInput("");
    setIsLoading(true);
    setError(null);

    let assistantContent = "";
    const assistantId = (Date.now() + 1).toString();

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setTabs(prev => prev.map(t => {
        if (t.id !== activeTabId) return t;
        const hasAssistant = t.messages.some(m => m.id === assistantId);
        if (hasAssistant) {
          return {
            ...t,
            messages: t.messages.map(m => 
              m.id === assistantId ? { ...m, content: assistantContent } : m
            )
          };
        }
        return {
          ...t,
          messages: [...t.messages, { id: assistantId, role: "assistant", content: assistantContent }]
        };
      }));
    };

    try {
      const allMessages = [...activeTab.messages, userMessage];
      await streamChat(allMessages, updateAssistant, () => setIsLoading(false));
    } catch (err) {
      console.error("Chat error:", err);
      setError(err instanceof Error ? err.message : "Failed to send message");
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const createNewTab = () => {
    const newId = Date.now().toString();
    setTabs(prev => [...prev, { id: newId, title: "New chat", messages: [] }]);
    setActiveTabId(newId);
    setInput("");
    setError(null);
  };

  const deleteTab = (tabId: string) => {
    if (tabs.length === 1) {
      // Reset the only tab
      setTabs([{ id: "1", title: "New chat", messages: [] }]);
      setActiveTabId("1");
    } else {
      const newTabs = tabs.filter(t => t.id !== tabId);
      setTabs(newTabs);
      if (activeTabId === tabId) {
        setActiveTabId(newTabs[newTabs.length - 1].id);
      }
    }
    setError(null);
  };

  const regenerateLastResponse = async () => {
    if (isLoading) return;
    const messages = activeTab.messages;
    const lastUserIdx = messages.map(m => m.role).lastIndexOf("user");
    if (lastUserIdx === -1) return;

    // Remove assistant messages after the last user message
    const newMessages = messages.slice(0, lastUserIdx + 1);
    setTabs(prev => prev.map(t => 
      t.id === activeTabId ? { ...t, messages: newMessages } : t
    ));

    setIsLoading(true);
    setError(null);

    let assistantContent = "";
    const assistantId = Date.now().toString();

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setTabs(prev => prev.map(t => {
        if (t.id !== activeTabId) return t;
        const hasAssistant = t.messages.some(m => m.id === assistantId);
        if (hasAssistant) {
          return {
            ...t,
            messages: t.messages.map(m => 
              m.id === assistantId ? { ...m, content: assistantContent } : m
            )
          };
        }
        return {
          ...t,
          messages: [...t.messages, { id: assistantId, role: "assistant", content: assistantContent }]
        };
      }));
    };

    try {
      await streamChat(newMessages, updateAssistant, () => setIsLoading(false));
    } catch (err) {
      console.error("Regenerate error:", err);
      setError(err instanceof Error ? err.message : "Failed to regenerate");
      setIsLoading(false);
    }
  };

  const toggleSpeech = (text: string) => {
    if (isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsSpeaking(false);
      speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const copyText = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const ChatContent = () => (
    <div className="flex flex-col h-full">
      {/* Tabs header */}
      <div className="flex items-center gap-1 px-2 py-2 border-b border-border overflow-x-auto scrollbar-hide">
        {tabs.map(tab => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors min-w-0",
              tab.id === activeTabId 
                ? "bg-primary/10 text-primary" 
                : "hover:bg-secondary text-muted-foreground"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <MessageCircle className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate max-w-[100px]">{tab.title}</span>
            <button
              onClick={(e) => { e.stopPropagation(); deleteTab(tab.id); }}
              className="ml-1 p-0.5 rounded hover:bg-destructive/20 hover:text-destructive transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </motion.button>
        ))}
        <motion.button
          onClick={createNewTab}
          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors flex-shrink-0"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="New chat"
        >
          <Plus className="h-4 w-4" />
        </motion.button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <div className="flex items-center gap-2 text-2xl font-semibold">
              <Sparkles className="h-8 w-8 text-primary" />
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                ReLyMi
              </span>
            </div>
            <p className="text-muted-foreground max-w-sm">
              Hi! I'm ReLyMi, your AI assistant. Ask me anything and I'll help you out.
            </p>
          </div>
        ) : (
          activeTab.messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-3",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
              <div className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3",
                msg.role === "user" 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-secondary"
              )}>
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{msg.content || "..."}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                )}
                {msg.role === "assistant" && msg.content && (
                  <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/50">
                    <button
                      onClick={() => copyText(msg.content, msg.id)}
                      className="p-1.5 rounded hover:bg-background/50 transition-colors"
                      title="Copy"
                    >
                      {copiedId === msg.id ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </button>
                    <button
                      onClick={() => toggleSpeech(msg.content)}
                      className="p-1.5 rounded hover:bg-background/50 transition-colors"
                      title={isSpeaking ? "Stop" : "Listen"}
                    >
                      {isSpeaking ? (
                        <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium">You</span>
                </div>
              )}
            </motion.div>
          ))
        )}
        
        {/* Loading indicator */}
        {isLoading && !activeTab.messages.some(m => m.role === "assistant" && m.content === "") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="bg-secondary rounded-2xl px-4 py-3 flex items-center gap-2">
              <img src={loadingGif} alt="Loading" className="h-6 w-6" />
              <span className="text-sm text-muted-foreground">Thinking...</span>
            </div>
          </motion.div>
        )}

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center"
          >
            <div className="bg-destructive/10 text-destructive rounded-lg px-4 py-2 text-sm">
              {error}
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-border">
        {activeTab.messages.length > 0 && activeTab.messages[activeTab.messages.length - 1]?.role === "assistant" && (
          <button
            onClick={regenerateLastResponse}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2 transition-colors disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Regenerate response
          </button>
        )}
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask ReLyMi anything..."
            className="flex-1 min-h-[44px] max-h-[120px] px-4 py-3 rounded-xl border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            rows={1}
            disabled={isLoading}
          />
          <motion.button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Send className="h-5 w-5" />
          </motion.button>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[85vh] max-h-[85vh]">
          <DrawerTitle className="sr-only">ReLyMi AI Chat</DrawerTitle>
          <ChatContent />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] max-h-[700px] p-0 overflow-hidden">
        <DialogTitle className="sr-only">ReLyMi AI Chat</DialogTitle>
        <ChatContent />
      </DialogContent>
    </Dialog>
  );
};

export default ReLyMiChat;
