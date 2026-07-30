import { useEffect, useState } from "react";
import { Bot, Send, Shield } from "lucide-react";

import {
  loadSystemChat,
  sendSystemChatMessage,
  type ChatMessage
} from "@/features/system-chat/systemChatService";
import type { SystemTone } from "@/types/enums";

const tones: Array<{ label: string; value: SystemTone }> = [
  { label: "Strategic Mentor", value: "strategic_mentor" },
  { label: "Cold Architect", value: "cold_architect" },
  { label: "Shadow Guard", value: "shadow_guard" }
];

export function SystemChatRoute() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [tone, setTone] = useState<SystemTone>("strategic_mentor");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void loadSystemChat().then(setMessages);
  }, []);

  async function submitMessage() {
    if (!input.trim() || busy) return;
    setBusy(true);
    const nextMessages = await sendSystemChatMessage(input, tone);
    setMessages(nextMessages);
    setInput("");
    setBusy(false);
  }

  return (
    <section className="mx-auto max-w-5xl space-y-4">
      <div className="system-panel rounded-sm p-5">
        <div className="system-panel-content">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="system-label text-xs font-semibold">System Chat</p>
              <h1 className="system-title mt-3 text-2xl font-black text-slate-50">
                Rule-based command channel.
              </h1>
            </div>
            <div className="flex items-center gap-2 rounded-sm border border-systemGreen/30 bg-systemGreen/10 px-3 py-2 text-[11px] uppercase tracking-[0.12em] text-systemGreen">
              <Shield className="size-4" />
              Local core
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <section className="system-panel rounded-sm p-4">
          <div className="system-panel-content flex min-h-[560px] flex-col">
            <div className="mb-4 flex justify-end">
              <select
                className="h-9 rounded-sm border border-systemBlue/25 bg-black/35 px-3 text-xs text-slate-100"
                onChange={(event) => setTone(event.target.value as SystemTone)}
                value={tone}
              >
                {tones.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {messages.length ? (
                messages.map((message) => <ChatBubble key={message.id} message={message} />)
              ) : (
                <div className="flex h-full min-h-[360px] flex-col items-center justify-center text-center text-slate-400">
                  <Bot className="mb-3 size-8 text-systemCyan" />
                  <p className="text-sm font-semibold text-slate-200">No messages yet.</p>
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-2 border-t border-systemBlue/15 pt-4">
              <input
                className="min-w-0 flex-1 rounded-sm border border-systemBlue/25 bg-black/35 px-3 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-systemBlue/60"
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void submitMessage();
                }}
                placeholder="Tell the System what you are deciding..."
                value={input}
              />
              <button
                aria-label="Send message"
                className="inline-flex size-12 items-center justify-center rounded-sm border border-systemBlue/40 bg-systemBlue/15 text-systemCyan shadow-system disabled:opacity-50"
                disabled={busy || !input.trim()}
                onClick={() => void submitMessage()}
                type="button"
              >
                <Send className="size-4" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <article className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[82%] rounded-sm border px-3 py-2 text-sm leading-6 ${
          isUser
            ? "border-systemBlue/35 bg-systemBlue/15 text-slate-100"
            : "border-systemGreen/25 bg-black/35 text-slate-300"
        }`}
      >
        {message.text}
      </div>
    </article>
  );
}
