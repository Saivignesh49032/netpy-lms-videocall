import { ReactNode } from 'react';

import StreamVideoProvider from '@/providers/StreamClientProvider';
import "@stream-io/video-react-sdk/dist/css/styles.css";

const RootLayout = ({ children }: Readonly<{ children: ReactNode }>) => {
  return (
    <main>
      <StreamVideoProvider>{children}</StreamVideoProvider>
    </main>
  );
};

export default RootLayout;
