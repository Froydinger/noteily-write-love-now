import arcanaLogo from "@/assets/arcana-logo-new.png";
import "./index.css";

const App = () => {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
      {/* Abyss background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(56,152,236,0.08)_0%,_transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(56,152,236,0.03)_0%,_transparent_40%)]" />

      {/* Logo */}
      <a
        href="https://arcananotes.com"
        target="_blank"
        rel="noopener noreferrer"
        className="relative group cursor-pointer flex flex-col items-center gap-8 z-10"
      >
        {/* Glow layers */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] md:w-[400px] md:h-[400px] rounded-full bg-[rgba(56,152,236,0.15)] blur-[80px] group-hover:bg-[rgba(56,152,236,0.25)] transition-all duration-700" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] h-[180px] md:w-[260px] md:h-[260px] rounded-full bg-[rgba(56,152,236,0.1)] blur-[40px] group-hover:bg-[rgba(56,152,236,0.2)] transition-all duration-700" />

        <img
          src={arcanaLogo}
          alt="Arcana Notes"
          className="w-32 h-32 md:w-48 md:h-48 relative z-10 drop-shadow-[0_0_30px_rgba(56,152,236,0.5)] group-hover:drop-shadow-[0_0_50px_rgba(56,152,236,0.7)] transition-all duration-500 group-hover:scale-105"
          style={{
            filter: "drop-shadow(0 0 20px rgba(56,152,236,0.4)) drop-shadow(0 0 60px rgba(56,152,236,0.2))",
          }}
        />

        <div className="relative z-10 text-center">
          <h1 className="text-white/90 text-sm md:text-base tracking-[0.3em] uppercase font-light">
            Arcana<span className="text-[10px] align-super">™</span> Notes
          </h1>
          <p className="text-white/30 text-[10px] md:text-xs tracking-[0.2em] mt-1.5 uppercase">
            powered by ArcAi<span className="text-[8px] align-super">™</span>
          </p>
        </div>
      </a>
    </div>
  );
};

export default App;
