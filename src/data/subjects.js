export const SYLLABUS_DATA = [
  { id: '1', name: 'General Aptitude' },
  { id: '2', name: 'Engineering Mathematics' },
  { id: '3', name: 'Digital Logic' },
  { id: '4', name: 'Computer Organization & Architecture' },
  { id: '5', name: 'Data Structures & Algorithms' },
  { id: '6', name: 'Operating Systems' },
  { id: '7', name: 'DBMS' },
  { id: '8', name: 'Computer Networks' },
  { id: '9', name: 'Theory of Computation' },
  { id: '10', name: 'Compiler Design' },
];

export const subjects = [
  {
    id: 'dm',
    name: 'Discrete Mathematics',
    topics: [
      { id: 'dm_sets', name: 'Sets & Relations', weightage: 3 },
      { id: 'dm_logic', name: 'Logic & Propositional Logic', weightage: 2 },
      {
        id: 'dm_functions',
        name: 'Functions & Pigeonhole Principle',
        weightage: 2,
      },
      { id: 'dm_counting', name: 'Counting & Combinatorics', weightage: 3 },
      { id: 'dm_recurrence', name: 'Recurrence Relations', weightage: 2 },
      { id: 'dm_graphs', name: 'Graph Theory', weightage: 3 },
    ],
    resources: {
      videos: [
        {
          title: 'Amit Khurana DM Playlist',
          url: 'https://youtube.com/playlist?list=PLxCzCOWd7aiH2wwES9vPWoKoAYzu0r0lx',
        },
        {
          title: 'Gate Smashers DM',
          url: 'https://youtube.com/playlist?list=PLxCzCOWd7aiH2wwES9vPWoKoAYzu0r0lx',
        },
      ],
      notes: ['dm_notes.pdf'],
    },
  },
  {
    id: 'os',
    name: 'Operating Systems',
    topics: [
      { id: 'os_process', name: 'Process Management', weightage: 3 },
      { id: 'os_threads', name: 'Threads & Concurrency', weightage: 3 },
      { id: 'os_scheduling', name: 'CPU Scheduling', weightage: 3 },
      { id: 'os_sync', name: 'Process Synchronization', weightage: 4 },
      { id: 'os_deadlock', name: 'Deadlocks', weightage: 2 },
      { id: 'os_memory', name: 'Memory Management', weightage: 3 },
      { id: 'os_virtual', name: 'Virtual Memory', weightage: 3 },
      { id: 'os_filesystem', name: 'File Systems', weightage: 2 },
    ],
    resources: {
      videos: [
        {
          title: 'Amit Khurana OS Playlist',
          url: 'https://youtube.com/playlist?list=PLxCzCOWd7aiGz9donHRrE9I3Mwn6XdP8p',
        },
        {
          title: 'Neso Academy OS',
          url: 'https://youtube.com/playlist?list=PLBlnK6fEyqRiVhbXDGLXDk_OQAeuVcp2O',
        },
      ],
      notes: ['os_notes.pdf'],
    },
  },
  {
    id: 'cn',
    name: 'Computer Networks',
    topics: [
      { id: 'cn_basics', name: 'Network Fundamentals', weightage: 2 },
      { id: 'cn_layers', name: 'OSI & TCP/IP Models', weightage: 3 },
      { id: 'cn_physical', name: 'Physical Layer', weightage: 2 },
      { id: 'cn_datalink', name: 'Data Link Layer', weightage: 3 },
      { id: 'cn_network', name: 'Network Layer & Routing', weightage: 4 },
      { id: 'cn_transport', name: 'Transport Layer', weightage: 3 },
      { id: 'cn_application', name: 'Application Layer', weightage: 2 },
      { id: 'cn_security', name: 'Network Security', weightage: 1 },
    ],
    resources: {
      videos: [
        {
          title: 'Amit Khurana CN Playlist',
          url: 'https://youtube.com/playlist?list=PLxCzCOWd7aiGFBD2-2joCpWOLUrDLvVV_',
        },
        {
          title: 'Gate Smashers CN',
          url: 'https://youtube.com/playlist?list=PLxCzCOWd7aiGFBD2-2joCpWOLUrDLvVV_',
        },
      ],
      notes: ['cn_notes.pdf'],
    },
  },
  // Add more subjects as needed
];

export default subjects;
