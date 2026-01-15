const phrases = [
  "Thinking very hard…",
  "Consulting the universe…",
  "Accessing forbidden knowledge…",
  "Arguing with myself…",
];

export default function Loader() {
  const phrase = phrases[Math.floor(Math.random() * phrases.length)];
  return <div className="loader">{phrase}</div>;
}
