import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, MailOpen, Reply, Send, CheckSquare, Square, Users, RefreshCw, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Label } from "@/components/ui/label";
import {
  useGetContactMessages,
  useMarkMessageRead,
  useReplyToMessage,
  useBulkReply,
  type ContactMessage,
} from "@/lib/adminApi";

export default function AdminMessages() {
  const { data, isLoading, refetch } = useGetContactMessages({ limit: 100 });
  const markRead = useMarkMessageRead();
  const reply = useReplyToMessage();
  const bulkReply = useBulkReply();
  const { toast } = useToast();

  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [replyText, setReplyText] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkReplyText, setBulkReplyText] = useState("");
  const [showBulkReply, setShowBulkReply] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function handleDelete(msgId: number, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this message permanently?")) return;
    setDeletingId(msgId);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/contact-messages/${msgId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) throw new Error("Failed");
      if (selected?.id === msgId) { setSelected(null); setReplyText(""); }
      toast({ title: "Message deleted" });
      refetch();
    } catch {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  }

  const messages = data?.messages || [];
  const unreadCount = data?.unread || 0;

  const handleSelect = (msg: ContactMessage) => {
    setSelected(msg);
    setReplyText(msg.adminReply || "");
    if (!msg.isRead) {
      markRead.mutate({ id: msg.id, isRead: true });
    }
  };

  const handleReply = async () => {
    if (!selected || !replyText.trim()) return;
    reply.mutate(
      { id: selected.id, replyText },
      {
        onSuccess: (data: any) => {
          toast({
            title: data.emailSent ? "Reply Sent!" : "Reply Saved",
            description: data.emailSent
              ? `Email sent to ${selected.email}`
              : data.resendConfigured
                ? "Reply saved but email failed"
                : "Reply saved. Configure RESEND_API_KEY to send emails.",
          });
          setSelected(null);
          setReplyText("");
        },
        onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
      }
    );
  };

  const toggleSelectId = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkReply = async () => {
    if (!selectedIds.size || !bulkReplyText.trim()) return;
    bulkReply.mutate(
      { ids: Array.from(selectedIds), replyText: bulkReplyText },
      {
        onSuccess: (data: any) => {
          const sent = (Array.isArray(data?.results) ? data.results : []).filter((r: any) => r.emailSent).length;
          toast({ title: "Bulk Reply Sent", description: `${sent}/${selectedIds.size} emails sent.` });
          setSelectedIds(new Set());
          setBulkReplyText("");
          setShowBulkReply(false);
        },
        onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
      }
    );
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="font-serif text-3xl">Messages</h1>
          {unreadCount > 0 && (
            <Badge className="bg-accent text-accent-foreground rounded-none uppercase tracking-widest text-xs">
              {unreadCount} New
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-none gap-2 uppercase tracking-widest text-xs" onClick={() => refetch()}>
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
          {selectedIds.size > 0 && (
            <Button size="sm" className="rounded-none gap-2 uppercase tracking-widest text-xs" onClick={() => setShowBulkReply(true)}>
              <Users className="w-3.5 h-3.5" /> Bulk Reply ({selectedIds.size})
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)] min-h-[500px]">
        {/* Message List */}
        <div className="lg:w-2/5 xl:w-1/3 bg-card border border-border overflow-y-auto flex-shrink-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-accent" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Mail className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">No messages yet</p>
            </div>
          ) : (
            messages.map(msg => (
              <div
                key={msg.id}
                onClick={() => handleSelect(msg)}
                className={`flex items-start gap-3 p-4 border-b border-border cursor-pointer transition-colors ${
                  selected?.id === msg.id ? "bg-accent/10 border-l-2 border-l-accent" : "hover:bg-muted/30"
                } ${!msg.isRead ? "bg-accent/5" : ""}`}
              >
                <div className="flex-shrink-0 pt-1" onClick={e => { e.stopPropagation(); toggleSelectId(msg.id); }}>
                  {selectedIds.has(msg.id)
                    ? <CheckSquare className="w-4 h-4 text-accent" />
                    : <Square className="w-4 h-4 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className={`text-sm truncate ${!msg.isRead ? "font-semibold" : "font-medium"}`}>
                      {msg.firstName} {msg.lastName}
                    </p>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {msg.replied && <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">Replied</span>}
                      {!msg.isRead && <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />}
                      <button
                        onClick={(e) => handleDelete(msg.id, e)}
                        disabled={deletingId === msg.id}
                        className="p-1 text-muted-foreground/40 hover:text-red-500 transition-colors disabled:opacity-50"
                        title="Delete message"
                      >
                        {deletingId === msg.id
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <Trash2 className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{msg.subject}</p>
                  <p className="text-xs text-muted-foreground mt-1">{format(new Date(msg.createdAt), "MMM d, h:mm a")}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message Detail */}
        <div className="flex-1 bg-card border border-border flex flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div key={selected.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex flex-col h-full">
                {/* Header */}
                <div className="p-6 border-b border-border">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-serif text-xl mb-1">{selected.subject}</h2>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{selected.firstName} {selected.lastName}</span>
                        <span>·</span>
                        <a href={`mailto:${selected.email}`} className="hover:text-accent transition-colors">{selected.email}</a>
                        <span>·</span>
                        <span>{format(new Date(selected.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-none text-xs gap-1.5"
                        onClick={() => markRead.mutate({ id: selected.id, isRead: !selected.isRead })}
                      >
                        {selected.isRead ? <Mail className="w-3.5 h-3.5" /> : <MailOpen className="w-3.5 h-3.5" />}
                        {selected.isRead ? "Mark Unread" : "Mark Read"}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Message Body */}
                <div className="p-6 border-b border-border flex-shrink-0">
                  <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{selected.message}</p>
                </div>

                {/* Previous reply */}
                {selected.adminReply && (
                  <div className="px-6 py-4 bg-accent/5 border-b border-border flex-shrink-0">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Previous Reply</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{selected.adminReply}</p>
                    {selected.repliedAt && (
                      <p className="text-xs text-muted-foreground mt-2">Sent {format(new Date(selected.repliedAt), "MMM d, h:mm a")}</p>
                    )}
                  </div>
                )}

                {/* Reply Area */}
                <div className="p-6 flex-1 flex flex-col gap-3">
                  <Label className="uppercase tracking-widest text-xs text-muted-foreground">
                    {selected.replied ? "Send Another Reply" : "Reply to"} {selected.firstName}
                  </Label>
                  <Textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder={`Dear ${selected.firstName},\n\nThank you for reaching out to Pearlis...`}
                    className="rounded-none flex-1 min-h-[140px] resize-none border-border"
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleReply}
                      disabled={reply.isPending || !replyText.trim()}
                      className="rounded-none uppercase tracking-widest text-xs gap-2"
                    >
                      {reply.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Send Reply
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Reply className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm">Select a message to view & reply</p>
                {selectedIds.size > 0 && (
                  <p className="text-xs mt-2">{selectedIds.size} message{selectedIds.size > 1 ? "s" : ""} selected for bulk reply</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bulk Reply Modal */}
      <AnimatePresence>
        {showBulkReply && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6"
            onClick={() => setShowBulkReply(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-background border border-border w-full max-w-lg p-8"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="font-serif text-2xl mb-2">Bulk Reply</h3>
              <p className="text-sm text-muted-foreground mb-6">Send the same reply to {selectedIds.size} selected message{selectedIds.size > 1 ? "s" : ""}.</p>
              <Textarea
                value={bulkReplyText}
                onChange={e => setBulkReplyText(e.target.value)}
                placeholder="Dear Customer,&#10;&#10;Thank you for contacting Pearlis..."
                className="rounded-none min-h-[180px] mb-6"
              />
              <div className="flex justify-end gap-3">
                <Button variant="outline" className="rounded-none uppercase tracking-widest text-xs" onClick={() => setShowBulkReply(false)}>
                  Cancel
                </Button>
                <Button
                  className="rounded-none uppercase tracking-widest text-xs gap-2"
                  disabled={bulkReply.isPending || !bulkReplyText.trim()}
                  onClick={handleBulkReply}
                >
                  {bulkReply.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send to {selectedIds.size} Recipients
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
