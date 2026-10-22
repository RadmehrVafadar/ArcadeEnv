export interface Exhibit {
  id: string;
  title: string;
  description: string;
  url: string;
}

export const exhibits: Exhibit[] = [{
  id: 'linkedin',
  title: 'The looking glass',
  description: 'Hey a mirror! Maybe I can see what I look like in it.',
  url: 'https://www.linkedin.com/in/radmehrv/',
}];
