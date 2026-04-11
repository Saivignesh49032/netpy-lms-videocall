'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@/hooks/useUser';
import { createClient } from '@/lib/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { MessageSquare, Users, Settings } from 'lucide-react';
import { useCallStateHooks } from '@stream-io/video-react-sdk';

export default function ChatWindow({
  callId,
  isTeacher,
  onClose,
}: {
  callId: string;
  isTeacher: boolean;
  onClose: () => void;
}) {
  const { user } = useUser();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const supabase = createClient();
  const [channel, setChannel] = useState<any>(null);
  
  // Private chat permissions
  const [privateAllowed, setPrivateAllowed] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<string>('everyone');

  // Participants for dropdown
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();

  useEffect(() => {
    if (!user) return;
    
    // Create a Supabase Realtime channel for this specific meeting
    const newChannel = supabase.channel(`room-${callId}`);

    newChannel
      .on('broadcast', { event: 'message' }, ({ payload }) => {
        // Only accept message if it's sent to everyone, or directly to me, or if I am the sender
        if (
          payload.recipient === 'everyone' ||
          payload.recipient === user.id ||
          payload.senderId === user.id
        ) {
          setMessages((prev) => [...prev, payload]);
        }
      })
      .on('broadcast', { event: 'permission' }, ({ payload }) => {
        if (payload.type === 'allow-private') {
          setPrivateAllowed(payload.value);
        }
      })
      .subscribe();

    setChannel(newChannel);

    return () => {
      supabase.removeChannel(newChannel);
    };
  }, [callId, user]);

  const sendMessage = () => {
    if (!input.trim() || !channel) return;

    const msg = {
      senderId: user?.id,
      senderName: user?.username || 'Unknown',
      text: input,
      recipient: selectedRecipient,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    channel.send({
      type: 'broadcast',
      event: 'message',
      payload: msg,
    });

    // Optimistically add it directly to sender's screen
    setMessages((prev) => [...prev, msg]);
    setInput('');
  };

  const togglePrivateChat = () => {
    const newValue = !privateAllowed;
    setPrivateAllowed(newValue);
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'permission',
        payload: { type: 'allow-private', value: newValue },
      });
    }
  };

  return (
    <div className="flex h-full flex-col bg-[#19232d] p-4 text-white">
      <div className="flex items-center justify-between mb-4 border-b border-dark-3 pb-2">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare size={18} /> Meeting Chat
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
      </div>

      {isTeacher && (
        <div className="mb-4 rounded bg-dark-3 p-3 flex justify-between items-center text-sm">
          <span>Allow Private Chat</span>
          <button 
            onClick={togglePrivateChat}
            className={`px-3 py-1 rounded text-xs transition ${privateAllowed ? 'bg-green-500' : 'bg-red-500'}`}
          >
            {privateAllowed ? 'ON' : 'OFF'}
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.senderId === user?.id ? 'items-end' : 'items-start'}`}>
            <span className="text-xs text-gray-400 mb-1">
              {m.senderName} {m.recipient !== 'everyone' && <span className="text-yellow-500">(Direct Message)</span>}
            </span>
            <div className={`px-3 py-2 rounded-lg text-sm max-w-[85%] ${m.senderId === user?.id ? 'bg-blue-1' : 'bg-dark-3'}`}>
              {m.text}
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="text-center text-gray-500 text-sm mt-10">No messages yet.</div>
        )}
      </div>

      <div className="flex flex-col gap-2 pt-2 border-t border-dark-3">
        {(isTeacher || privateAllowed) ? (
          <select 
            value={selectedRecipient} 
            onChange={(e) => setSelectedRecipient(e.target.value)}
            className="bg-dark-3 text-xs p-1 rounded border-none focus:ring-0 text-gray-300"
          >
            <option value="everyone">To: Everyone</option>
            {participants.map(p => (
              p.userId !== user?.id && <option key={p.userId} value={p.userId}>To: {p.name || p.userId}</option>
            ))}
          </select>
        ) : (
          <div className="text-xs text-gray-400 bg-dark-3 p-1 rounded">To: Everyone (Private Chat Disabled)</div>
        )}
        
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type message..."
            className="bg-dark-3 border-none text-sm"
          />
          <Button onClick={sendMessage} className="bg-blue-1">Send</Button>
        </div>
      </div>
    </div>
  );
}
