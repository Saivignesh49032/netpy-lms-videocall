'use client';
import { useState } from 'react';
import {
  CallParticipantsList,
  CallStatsButton,
  CallingState,
  PaginatedGridLayout,
  SpeakerLayout,
  useCallStateHooks,
  CancelCallButton,
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
  ScreenShareButton,
  RecordCallButton,
  ReactionsButton,
  SpeakingWhileMutedNotification,
  useCall,
} from '@stream-io/video-react-sdk';
import { useRouter, useSearchParams } from 'next/navigation';
import { Users, LayoutList, MessageSquare, Hand, PenLine } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import Loader from './Loader';
import EndCallButton from './EndCallButton';
import ChatWindow from './ChatWindow';
import Whiteboard from './Whiteboard';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/useUser';
import { useToast } from './ui/use-toast';
import { useEffect } from 'react';

type CallLayoutType = 'grid' | 'speaker-left' | 'speaker-right';

const MeetingRoom = () => {
  const searchParams = useSearchParams();
  const isPersonalRoom = !!searchParams.get('personal');
  const router = useRouter();
  const [layout, setLayout] = useState<CallLayoutType>('grid');
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const { useCallCallingState, useLocalParticipant } = useCallStateHooks();
  const { user } = useUser();
  const { toast } = useToast();

  // for more detail about types of CallingState see: https://getstream.io/video/docs/react/ui-cookbook/ringing-call/#incoming-call-panel
  const callingState = useCallCallingState();
  const localParticipant = useLocalParticipant();
  const call = useCall();
  
  const isMeetingOwner = user?.role === 'teacher';

  useEffect(() => {
    if (!call) return;
    const unsubscribe = call.on('call.reaction_new', (event) => {
      const e = event as any;
      if (e.reaction?.type === 'raised-hand') {
        const reactedUser = e.reaction.user || e.user;
        const name = reactedUser?.name || reactedUser?.id;
        if (isMeetingOwner) {
          toast({ title: `${name} raised their hand! ✋` });
        }
        
        // Add a golden border effect temporarily
        const tiles = document.querySelectorAll('.str-video__participant-view');
        tiles.forEach(tile => {
          if (tile.innerHTML.includes(reactedUser?.id) || tile.innerHTML.includes(name)) {
            tile.classList.add('golden-border');
            setTimeout(() => tile.classList.remove('golden-border'), 10000);
          }
        });
      }
    });
    return () => unsubscribe();
  }, [call, isMeetingOwner, toast]);

  const toggleRaiseHand = async () => {
    try {
      await call?.sendReaction({ type: 'raised-hand', emoji_code: ':raise-hand:' });
      toast({ title: 'You raised your hand' });
    } catch(err) {
      console.error(err);
    }
  };

  if (callingState !== CallingState.JOINED) return <Loader />;

  const CallLayout = () => {
    switch (layout) {
      case 'grid':
        return <PaginatedGridLayout />;
      case 'speaker-right':
        return <SpeakerLayout participantsBarPosition="left" />;
      default:
        return <SpeakerLayout participantsBarPosition="right" />;
    }
  };

  return (
    <section className="relative h-screen w-full overflow-hidden pt-4 text-white">
      <style>{`
        .golden-border {
          border: 4px solid gold !important;
          border-radius: 12px;
          box-shadow: 0 0 15px gold;
          transition: all 0.3s ease;
        }
      `}</style>
      <div className="relative flex size-full items-center justify-center">
        {showWhiteboard ? (
          <div className="flex size-full items-center p-4">
            <Whiteboard 
              meetingId={call?.id ?? ''}
              isHost={isMeetingOwner}
              currentUserId={user?.id ?? ''}
              currentUserName={user?.username ?? ''}
            />
          </div>
        ) : (
          <div className=" flex size-full max-w-[1000px] items-center">
            <CallLayout />
          </div>
        )}
        
        <div
          className={cn('h-[calc(100vh-86px)] hidden ml-2 w-[350px] rounded-lg overflow-hidden', {
            'show-block': showChat,
          })}
        >
          {call?.id && <ChatWindow callId={call.id} isTeacher={isMeetingOwner} onClose={() => setShowChat(false)} />}
        </div>
        <div
          className={cn('h-[calc(100vh-86px)] hidden ml-2', {
            'show-block': showParticipants,
          })}
        >
          <CallParticipantsList onClose={() => setShowParticipants(false)} />
        </div>
      </div>
      {/* video layout and call controls */}
      <div className="fixed bottom-0 flex w-full flex-wrap items-center justify-center gap-5 pb-5 mt-4">
        <div className="flex items-center justify-center gap-5">
          {isMeetingOwner && <RecordCallButton />}
          
          <button onClick={toggleRaiseHand} className="transition-all hover:scale-105">
            <div className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]">
              <Hand size={20} className="text-white" />
            </div>
          </button>
          
          <ReactionsButton />
          {isMeetingOwner && <ScreenShareButton />}
          <SpeakingWhileMutedNotification>
            <ToggleAudioPublishingButton />
          </SpeakingWhileMutedNotification>
          <ToggleVideoPublishingButton />
          <CancelCallButton onLeave={() => router.push(`/`)} />
        </div>

        <button onClick={() => setShowChat((prev) => !prev)} className="transition-all hover:scale-105">
          <div className={cn("cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b] flex items-center gap-2", {"bg-blue-1 hover:bg-blue-600": showChat })}>
            <MessageSquare size={20} className="text-white" />
          </div>
        </button>

        <button onClick={() => setShowWhiteboard((prev) => !prev)} className="transition-all hover:scale-105">
          <div className={cn("cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b] flex items-center gap-2", {"bg-blue-1 hover:bg-blue-600": showWhiteboard })}>
            <PenLine size={20} className="text-white" />
          </div>
        </button>

        <DropdownMenu>
          <div className="flex items-center">
            <DropdownMenuTrigger className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]  ">
              <LayoutList size={20} className="text-white" />
            </DropdownMenuTrigger>
          </div>
          <DropdownMenuContent className="border-dark-1 bg-dark-1 text-white">
            {['Grid', 'Speaker-Left', 'Speaker-Right'].map((item, index) => (
              <div key={index}>
                <DropdownMenuItem
                  onClick={() =>
                    setLayout(item.toLowerCase() as CallLayoutType)
                  }
                >
                  {item}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="border-dark-1" />
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <CallStatsButton />
        <button onClick={() => setShowParticipants((prev) => !prev)}>
          <div className=" cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]  ">
            <Users size={20} className="text-white" />
          </div>
        </button>
        {!isPersonalRoom && <EndCallButton />}
      </div>
    </section>
  );
};

export default MeetingRoom;
