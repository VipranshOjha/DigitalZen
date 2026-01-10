import React, { useState } from 'react';
import { Flame, Meh, CloudOff, RotateCcw, Music, Lightbulb, Heart } from 'lucide-react';

const MOOD_CONTENT = {
  burnout: [
    {
      message: "It's okay to step away. Your code will be there when you return, refreshed and ready.",
      song: { artist: "Nujabes", title: "Feather", url: "https://spotify.com" },
      tip: "Take a 20-minute walk. Your brain needs oxygen more than your IDE needs you right now."
    },
    {
      message: "Even the best machines need maintenance. You're not a machine—you deserve rest.",
      song: { artist: "Jinsang", title: "Affection", url: "https://spotify.com" },
      tip: "Try the 20-20-20 rule: Every 20 minutes, look at something 20 feet away for 20 seconds."
    },
    {
      message: "Burnout is your body's way of saying 'I need care.' Listen to it.",
      song: { artist: "Tom Misch", title: "Movie", url: "https://spotify.com" },
      tip: "Close your laptop. Go drink water. Stretch your neck. The bug will still be there."
    },
    {
      message: "You've been pushing hard. It's time to let yourself recover without guilt.",
      song: { artist: "Idealism", title: "Lonely", url: "https://spotify.com" },
      tip: "Set a timer for 15 minutes and just breathe. No screen time. Just exist."
    },
    {
      message: "Your worth isn't measured in commits. Rest is productive too.",
      song: { artist: "Swørn", title: "Sleepless", url: "https://spotify.com" },
      tip: "Check your posture. Straighten your back. Drop your shoulders. Unclench your jaw."
    },
    {
      message: "Debugging yourself is just as important as debugging code.",
      song: { artist: "L'Indécis", title: "Reflection", url: "https://spotify.com" },
      tip: "Write down three things stressing you out. Then close the list and ignore it for an hour."
    }
  ],
  neutral: [
    {
      message: "Consistency beats intensity. Keep showing up, keep shipping.",
      song: { artist: "HOME", title: "Resonance", url: "https://spotify.com" },
      tip: "Refactor one small function today. Clean code is a gift to future you."
    },
    {
      message: "You're in the zone of sustainable productivity. This is the sweet spot.",
      song: { artist: "The Midnight", title: "Sunset", url: "https://spotify.com" },
      tip: "Write a comment explaining *why* you made that architectural decision."
    },
    {
      message: "Steady progress compounds. You're building something great, line by line.",
      song: { artist: "Neon Indian", title: "Deadbeat Summer", url: "https://spotify.com" },
      tip: "Use destructuring assignment—it makes your code cleaner and easier to read."
    },
    {
      message: "The calm developer is the effective developer. You're right where you need to be.",
      song: { artist: "Tycho", title: "Awake", url: "https://spotify.com" },
      tip: "Add error handling to that function you wrote yesterday. Future you will thank you."
    },
    {
      message: "Balance is not something you find, it's something you create. You're doing it.",
      song: { artist: "Com Truise", title: "Brokendate", url: "https://spotify.com" },
      tip: "Extract that repeated code into a reusable utility function. DRY principle for the win."
    },
    {
      message: "Smooth seas make steady sailors. Your measured pace is your superpower.",
      song: { artist: "Electric Youth", title: "Runaway", url: "https://spotify.com" },
      tip: "Use const and let appropriately. Immutability reduces bugs."
    }
  ],
  lockedIn: [
    {
      message: "You are a machine right now. Channel this energy. Ship that feature.",
      song: { artist: "Gesaffelstein", title: "Pursuit", url: "https://spotify.com" },
      tip: "Use Promise.all() for parallel async operations. Speed matters when you're in flow."
    },
    {
      message: "This is your moment. The code bends to your will. Keep crushing it.",
      song: { artist: "Carpenter Brut", title: "Turbo Killer", url: "https://spotify.com" },
      tip: "Memoize expensive computations with useMemo. Optimize everything."
    },
    {
      message: "You're not just writing code—you're architecting the future. Stay locked.",
      song: { artist: "Daft Punk", title: "Harder Better Faster", url: "https://spotify.com" },
      tip: "Batch your state updates. Multiple setState calls? Combine them for better performance."
    },
    {
      message: "Peak performance unlocked. Ride this wave as far as it takes you.",
      song: { artist: "Justice", title: "Genesis", url: "https://spotify.com" },
      tip: "Lazy load those heavy components. Code splitting = faster load times = happy users."
    },
    {
      message: "You're in the flow state. This is where legends are made. Push harder.",
      song: { artist: "Perturbator", title: "Humans Are Such Easy Prey", url: "https://spotify.com" },
      tip: "Debounce that input handler. 300ms delay = way fewer renders. Micro-optimizations matter."
    },
    {
      message: "Unstoppable. Unbreakable. Unforgettable code being written right now.",
      song: { artist: "Kavinsky", title: "Nightcall", url: "https://spotify.com" },
      tip: "Use Web Workers for heavy computations. Keep the main thread buttery smooth."
    }
  ]
};

export default function DeveloperMoodTracker() {
  const [phase, setPhase] = useState('input');
  const [selectedMood, setSelectedMood] = useState(null);
  const [content, setContent] = useState(null);
  const [usedIndices, setUsedIndices] = useState({ burnout: [], neutral: [], lockedIn: [] });

  const getRandomContent = (mood) => {
    const moodContent = MOOD_CONTENT[mood];
    const availableIndices = moodContent
      .map((_, i) => i)
      .filter(i => !usedIndices[mood].includes(i));
    
    let index;
    if (availableIndices.length === 0) {
      setUsedIndices(prev => ({ ...prev, [mood]: [] }));
      index = Math.floor(Math.random() * moodContent.length);
    } else {
      index = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    }
    
    setUsedIndices(prev => ({
      ...prev,
      [mood]: [...prev[mood], index]
    }));
    
    return moodContent[index];
  };

  const handleMoodSelect = (mood) => {
    const randomContent = getRandomContent(mood);
    setSelectedMood(mood);
    setContent(randomContent);
    setPhase('output');
  };

  const handleReset = () => {
    setPhase('input');
    setSelectedMood(null);
    setContent(null);
  };

  const moodOptions = [
    {
      id: 'burnout',
      emoji: '😵',
      label: 'Burnt out',
      description: 'Need a break',
      bgColor: 'from-red-950/40 to-red-900/20',
      hoverColor: 'hover:from-red-900/60 hover:to-red-800/40',
      borderColor: 'border-red-800/30',
      icon: CloudOff
    },
    {
      id: 'neutral',
      emoji: '😐',
      label: 'Neutral',
      description: 'Steady state',
      bgColor: 'from-slate-800/40 to-slate-700/20',
      hoverColor: 'hover:from-slate-700/60 hover:to-slate-600/40',
      borderColor: 'border-slate-600/30',
      icon: Meh
    },
    {
      id: 'lockedIn',
      emoji: '🔥',
      label: 'Locked in',
      description: 'Peak performance',
      bgColor: 'from-purple-900/40 to-orange-900/20',
      hoverColor: 'hover:from-purple-800/60 hover:to-orange-800/40',
      borderColor: 'border-purple-600/30',
      icon: Flame
    }
  ];

  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-5xl">
        {phase === "input" && (
          <div className="space-y-10">
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight border-4 border-black p-6 inline-block bg-yellow-300 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              How is your code flowing today?
            </h1>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Burnout */}
              <button
                onClick={() => handleMoodSelect("burnout")}
                className="bg-white border-4 border-black p-8 text-left
                shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
                hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]
                active:translate-y-0 active:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                transition-all"
              >
                <CloudOff size={36} className="mb-4" />
                <h2 className="text-2xl font-extrabold mb-2"> Burnt Out</h2>
                <p className="font-bold">Need a break</p>
              </button>

              {/* Neutral */}
              <button
                onClick={() => handleMoodSelect("neutral")}
                className="bg-purple-300 border-4 border-black p-8 text-left
                shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
                hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]
                active:translate-y-0 active:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                transition-all"
              >
                <Meh size={36} className="mb-4" />
                <h2 className="text-2xl font-extrabold mb-2"> Neutral</h2>
                <p className="font-bold">Steady state</p>
              </button>

              {/* Locked In */}
              <button
                onClick={() => handleMoodSelect("lockedIn")}
                className="bg-yellow-300 border-4 border-black p-8 text-left
                shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
                hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]
                active:translate-y-0 active:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                transition-all"
              >
                <Flame size={36} className="mb-4" />
                <h2 className="text-2xl font-extrabold mb-2"> Locked In</h2>
                <p className="font-bold">Peak performance</p>
              </button>
            </div>
          </div>
        )}

        {phase === "output" && content && (
          <div className="bg-white border-4 border-black p-10 space-y-8
          shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">

            <div className="flex justify-between items-center">
              <h2 className="text-4xl font-extrabold">
                Developer Dashboard
              </h2>
              <button
                onClick={handleReset}
                className="border-4 border-black p-3 bg-purple-300
                shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                active:translate-y-1 active:shadow-none transition-all"
              >
                <RotateCcw />
              </button>
            </div>

            {/* Motivation */}
            <div className="border-4 border-black p-6">
              <div className="flex items-center gap-3 mb-3">
                <Heart />
                <h3 className="text-xl font-extrabold">Motivation</h3>
              </div>
              <p className="text-lg font-bold">{content.message}</p>
            </div>

            {/* Song */}
            <div className="border-4 border-black p-6">
              <div className="flex items-center gap-3 mb-3">
                <Music />
                <h3 className="text-xl font-extrabold">Sound Track</h3>
              </div>
              <a
                href={content.song.url}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-lg underline"
              >
                {content.song.artist} — {content.song.title}
              </a>
            </div>

            {/* Tip */}
            <div className="border-4 border-black p-6 bg-yellow-300">
              <div className="flex items-center gap-3 mb-3">
                <Lightbulb />
                <h3 className="text-xl font-extrabold">Dev Tip</h3>
              </div>
              <p className="font-mono text-base">
                {content.tip}
              </p>
            </div>

            <p className="text-sm font-bold">
              Selected mood:{" "}
              <span className="uppercase">
                {selectedMood === "lockedIn" ? "Locked In" : selectedMood}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
