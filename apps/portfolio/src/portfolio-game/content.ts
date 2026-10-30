export interface Exhibit {
  id: string;
  title: string;
  description: string;
  url: string;
  internal?: boolean;
}
export const exhibits: Exhibit[] = [
  { id: 'linkedin', title: 'The looking glass', description: 'Hey a mirror! Maybe I can see what I look like in it.', url: 'https://www.linkedin.com/in/radmehrv/' },
  { id: 'punch-out', title: "Mike Tyson's Punch-Out!!", description: 'Step into the ring.', url: 'src/punch-out/punch-out.html', internal: true },
  { id: 'fake-news', title: 'Fake News Detector', description: 'An AI fake news detector? I wonder how it works.', url: 'https://github.com/RadmehrVafadar/AI-fake-news-detector' },
  { id: 'music-orb', title: 'Music Orb', description: 'A magical orb that visualises my favourite songs.', url: 'https://github.com/RadmehrVafadar/voiceEmotionVisualizer' },
  { id: 'distributed-video', title: 'Distributed Video Streaming', description: 'A distributed video player that can play videos from multiple sources.', url: 'https://github.com/RadmehrVafadar/Distributed-Video-Streaming' },
  { id: 'minesweeper', title: 'Minesweeper', description: 'A recreation of the classic game Minesweeper from scratch in python using pygame.', url: 'https://github.com/RadmehrVafadar/mine-sweeper' },
];
