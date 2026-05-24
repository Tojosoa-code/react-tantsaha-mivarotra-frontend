import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import api from "@/lib/axios";

interface Message {
  id: number;
  sender_nom: string;
  content: string;
  is_me: boolean;
  created_at: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  matchId: number | null;
  contactNom: string;
  productName: string;
}

export default function ChatDialog({
  open,
  onClose,
  matchId,
  contactNom,
  productName,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !matchId) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [open, matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async () => {
    if (!matchId) return;
    try {
      const res = await api.get(`/messages/${matchId}`);
      setMessages(res.data);
    } catch {}
  };

  const sendMessage = async () => {
    if (!input.trim() || !matchId) return;
    setSending(true);
    try {
      const res = await api.post(`/messages/${matchId}`, {
        content: input.trim(),
      });
      setMessages((prev) => [...prev, res.data]);
      setInput("");
    } catch {
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
              {contactNom[0]}
            </div>
            {contactNom}
          </DialogTitle>
          <DialogDescription>Négociation — {productName}</DialogDescription>
        </DialogHeader>

        {/* Messages */}
        <div className="h-72 overflow-y-auto flex flex-col gap-2 py-2 px-1">
          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-muted-foreground text-center">
                Démarrez la négociation en envoyant un message
              </p>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.is_me ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                    m.is_me
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted rounded-bl-sm"
                  }`}
                >
                  <p>{m.content}</p>
                  <p
                    className={`text-[10px] mt-1 ${
                      m.is_me
                        ? "text-primary-foreground/70 text-right"
                        : "text-muted-foreground"
                    }`}
                  >
                    {new Date(m.created_at).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2 pt-2 border-t">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Votre message..."
            className="flex-1"
            disabled={sending}
          />
          <Button
            size="icon"
            onClick={sendMessage}
            disabled={sending || !input.trim()}
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
