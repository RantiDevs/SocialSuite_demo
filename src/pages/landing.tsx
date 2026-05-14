import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring, useInView } from "framer-motion";
import { useLocation } from "wouter";

// ─── Canvas 2D Particle Field (no WebGL required) ───────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Particle system
    const COLORS = ["#eab308", "#ca8a04", "#fbbf24", "#fef08a", "#fde047"];
    const count = 140;
    type Particle = { x: number; y: number; vx: number; vy: number; r: number; color: string; alpha: number; };
    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 2 + 0.5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: Math.random() * 0.5 + 0.15,
    }));

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    const onMouse = (e: MouseEvent) => { mouseX = e.clientX; mouseY = e.clientY; };
    window.addEventListener("mousemove", onMouse);

    const CONNECTION_DIST = 130;
    let animId: number;

    const draw = () => {
      animId = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Mouse attraction
      particles.forEach(p => {
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 220) {
          p.vx += dx * 0.00008;
          p.vy += dy * 0.00008;
        }
        p.vx *= 0.998;
        p.vy *= 0.998;
        p.x += p.vx;
        p.y += p.vy;
        // Wrap edges
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
      });

      // Draw connections
      for (let i = 0; i < count; i++) {
        for (let j = i + 1; j < count; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < CONNECTION_DIST) {
            ctx.beginPath();
            ctx.strokeStyle = particles[i].color;
            ctx.globalAlpha = (1 - d / CONNECTION_DIST) * 0.18;
            ctx.lineWidth = 0.6;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      particles.forEach(p => {
        ctx.beginPath();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });
      ctx.globalAlpha = 1;
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
}

// ─── Floating 3D Dashboard Mockup ───────────────────────────────────────────
function FloatingMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const [rot, setRot] = useState({ x: 0, y: 0 });

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setRot({
      x: ((e.clientY - cy) / rect.height) * -18,
      y: ((e.clientX - cx) / rect.width) * 18,
    });
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={() => setRot({ x: 0, y: 0 })}
      animate={{ y: [0, -16, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      style={{
        perspective: 1000,
        transformStyle: "preserve-3d",
      }}
      className="relative w-full max-w-2xl cursor-pointer select-none"
    >
      <motion.div
        animate={{ rotateX: rot.x, rotateY: rot.y }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        style={{ transformStyle: "preserve-3d" }}
        className="relative rounded-2xl overflow-hidden"
      >
        {/* Glow behind mockup */}
        <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-violet-600/40 via-indigo-500/30 to-cyan-500/20 blur-2xl -z-10" />
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-violet-500/60 via-indigo-400/40 to-cyan-400/30 blur-md -z-10" />

        {/* Main card */}
        <div className="rounded-2xl border border-white/10 bg-slate-950/90 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Header bar */}
          <div className="flex items-center gap-2 px-4 py-3 bg-slate-900/80 border-b border-white/5">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-400/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
            <div className="ml-3 flex-1 h-5 bg-slate-800/60 rounded-md" />
          </div>

          {/* Dashboard content mockup */}
          <div className="p-5 grid grid-cols-3 gap-3">
            {[
              { label: "Total Views", val: "24.8M", color: "from-violet-500 to-indigo-500" },
              { label: "Avg. Engagement", val: "6.4%", color: "from-cyan-500 to-blue-500" },
              { label: "Reels Tracked", val: "1,247", color: "from-fuchsia-500 to-pink-500" },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.15 }}
                className="rounded-xl bg-slate-800/50 p-3 border border-white/5"
              >
                <div className={`text-xs font-medium bg-gradient-to-r ${s.color} bg-clip-text text-transparent mb-1`}>{s.label}</div>
                <div className="text-xl font-bold text-white">{s.val}</div>
                <div className="mt-2 h-1 rounded-full bg-slate-700">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${55 + i * 15}%` }}
                    transition={{ delay: 0.8 + i * 0.2, duration: 1.2, ease: "easeOut" }}
                    className={`h-full rounded-full bg-gradient-to-r ${s.color}`}
                  />
                </div>
              </motion.div>
            ))}

            {/* Chart area */}
            <div className="col-span-2 rounded-xl bg-slate-800/50 p-3 border border-white/5">
              <div className="text-xs text-slate-400 mb-2">Reel Performance</div>
              <div className="flex items-end gap-1 h-16">
                {[40, 65, 45, 80, 60, 95, 70, 85, 55, 90, 75, 100].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: 1 + i * 0.05, duration: 0.6, ease: "easeOut" }}
                    className="flex-1 rounded-t bg-gradient-to-t from-violet-600/80 to-indigo-400/80"
                  />
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-slate-800/50 p-3 border border-white/5">
              <div className="text-xs text-slate-400 mb-2">Top Creator</div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-pink-500" />
                <div>
                  <div className="text-xs font-semibold text-white">@creator</div>
                  <div className="text-xs text-slate-400">2.3M followers</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3D depth shadow */}
        <div
          style={{ transform: "translateZ(-40px) translateY(30px)", transformStyle: "preserve-3d" }}
          className="absolute inset-0 rounded-2xl bg-violet-900/30 blur-xl -z-10"
        />
      </motion.div>
    </motion.div>
  );
}

// ─── Feature Card ────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, gradient, delay }: any) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [hovered, setHovered] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60, rotateX: 15 }}
      animate={inView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={handleMouse}
      style={{ perspective: 600 }}
      className="relative group cursor-pointer"
    >
      <motion.div
        animate={hovered
          ? { rotateY: (pos.x - 160) / 20, rotateX: -(pos.y - 100) / 20, scale: 1.04 }
          : { rotateY: 0, rotateX: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        style={{ transformStyle: "preserve-3d" }}
        className="relative rounded-2xl border border-white/8 bg-slate-900/70 backdrop-blur-md p-6 overflow-hidden"
      >
        {/* Spotlight effect */}
        {hovered && (
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300"
            style={{
              background: `radial-gradient(280px circle at ${pos.x}px ${pos.y}px, rgba(139,92,246,0.13), transparent 80%)`,
            }}
          />
        )}

        {/* Top gradient line */}
        <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${gradient}`} />

        <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center bg-gradient-to-br ${gradient} bg-opacity-20`}>
          <span className="text-2xl">{icon}</span>
        </div>
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>

        {/* 3D floating badge */}
        <div
          style={{ transform: "translateZ(20px)" }}
          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <div className={`px-2 py-1 rounded-md text-xs font-semibold bg-gradient-to-r ${gradient} text-white`}>
            PRO
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Stat Counter ────────────────────────────────────────────────────────────
function StatCounter({ value, label, suffix = "" }: any) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const target = parseFloat(value.replace(/[^0-9.]/g, ""));
    const duration = 2000;
    const start = Date.now();
    const timer = setInterval(() => {
      const progress = Math.min((Date.now() - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * target));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, value]);

  const numPart = value.replace(/[^0-9.]/g, "");
  const prefix = value.slice(0, value.search(/[0-9]/)) || "";
  const postfix = value.slice(numPart.length + prefix.length) || suffix;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.6, type: "spring" }}
      className="text-center"
    >
      <div className="text-5xl font-black bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent tabular-nums">
        {prefix}{count.toLocaleString()}{postfix}
      </div>
      <div className="mt-2 text-sm text-slate-400 font-medium uppercase tracking-widest">{label}</div>
    </motion.div>
  );
}

// ─── Horizontal Scroll Carousel ──────────────────────────────────────────────
function Carousel() {
  const items = [
    { label: "Reel Analytics", desc: "Deep-dive metrics on every post", color: "from-violet-600 to-indigo-600", emoji: "📊" },
    { label: "Follower Growth", desc: "Track growth over time with charts", color: "from-cyan-500 to-blue-600", emoji: "📈" },
    { label: "Engagement Rate", desc: "Views, likes, comments benchmarked", color: "from-pink-500 to-rose-600", emoji: "💥" },
    { label: "Creator Insights", desc: "Compare multiple Instagram accounts", color: "from-amber-500 to-orange-600", emoji: "🔍" },
    { label: "Video Tagging", desc: "Tag and filter content intelligently", color: "from-emerald-500 to-teal-600", emoji: "🏷️" },
    { label: "Crypto Payments", desc: "Buy licenses with BTC, ETH & more", color: "from-fuchsia-500 to-purple-600", emoji: "₿" },
  ];

  // Double the items for seamless infinite scroll
  const doubledItems = [...items, ...items];

  return (
    <div className="relative overflow-hidden py-10">
      {/* Gradient Fades */}
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-slate-950 to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-slate-950 to-transparent z-10" />
      
      <motion.div 
        animate={{ x: ["0%", "-50%"] }}
        transition={{ 
          duration: 30, 
          repeat: Infinity, 
          ease: "linear" 
        }}
        className="flex gap-6 w-max px-4"
      >
        {doubledItems.map((item, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -10, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            style={{ minWidth: 320 }}
            className={`rounded-2xl bg-gradient-to-br ${item.color} p-px cursor-pointer flex-shrink-0 group shadow-lg hover:shadow-2xl transition-shadow`}
          >
            <div className="rounded-2xl bg-slate-950/90 backdrop-blur-xl p-8 h-full border border-white/5">
              <div className="text-4xl mb-4 transform group-hover:scale-125 transition-transform duration-300 inline-block">{item.emoji}</div>
              <div className="text-xl font-black text-white mb-2 tracking-tight">{item.label}</div>
              <div className="text-sm text-slate-400 leading-relaxed font-medium">{item.desc}</div>
              
              <div className="mt-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                <span className="text-[10px] uppercase font-black tracking-widest text-white/40">Premium Module</span>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Pricing Card ────────────────────────────────────────────────────────────
function PricingCard({ plan, price, features, highlighted, delay }: any) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      whileHover={{ y: -10 }}
      className="relative"
    >
      {highlighted && (
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-500 to-cyan-500 -z-10" />
      )}
      <div className={`rounded-2xl ${highlighted ? "bg-slate-900 border-transparent" : "bg-slate-900/60 border border-white/8"} backdrop-blur-md p-7 h-full`}>
        {highlighted && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full text-xs font-bold text-white whitespace-nowrap">
            MOST POPULAR
          </div>
        )}
        <div className="text-slate-400 text-sm font-semibold uppercase tracking-widest mb-2">{plan}</div>
        <div className="text-4xl font-black text-white mb-1">${price}<span className="text-base font-normal text-slate-400">/mo</span></div>
        <div className="h-px bg-white/8 my-5" />
        <ul className="space-y-3 mb-7">
          {features.map((f: string, i: number) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
              <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span> {f}
            </li>
          ))}
        </ul>
        <motion.button
          whileTap={{ scale: 0.96 }}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
            highlighted
              ? "bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40"
              : "border border-white/10 text-white hover:bg-white/5"
          }`}
        >
          Get Started
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Scroll Reveal Text ───────────────────────────────────────────────────────
function RevealText({ children, delay = 0, className = "" }: any) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Marquee Strip ────────────────────────────────────────────────────────────
function Marquee() {
  const items = ["RapidAPI", "Real-time Data", "NowPayments", "Crypto Payments", "PostgreSQL", "Multi-user SaaS", "Reel Analytics", "Follower Tracking", "License Management", "Engagement Metrics"];
  return (
    <div className="relative overflow-hidden py-4">
      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-slate-950 to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-slate-950 to-transparent z-10" />
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="flex gap-8 w-max"
      >
        {[...items, ...items].map((item, i) => (
          <div key={i} className="flex items-center gap-3 whitespace-nowrap text-sm text-slate-400 font-medium">
            <span className="w-1 h-1 rounded-full bg-violet-500" />
            {item}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Main Landing Page ────────────────────────────────────────────────────────
export default function Landing() {
  const [, navigate] = useLocation();
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const heroY = useTransform(scrollY, [0, 500], [0, 120]);
  const navBg = useTransform(scrollY, [0, 100], ["rgba(2,6,23,0)", "rgba(2,6,23,0.85)"]);

  return (
    <div className="relative bg-slate-950 text-white overflow-x-hidden">
      <ParticleCanvas />

      {/* ── Navigation ── */}
      <motion.nav
        style={{ backgroundColor: navBg }}
        className="fixed top-0 inset-x-0 z-50 backdrop-blur-md border-b border-white/0 transition-colors duration-300"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 group cursor-pointer"
          >
            <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center border border-yellow-500/30 group-hover:border-yellow-500/60 transition-colors">
              <span className="text-yellow-500 font-black text-lg tracking-tighter drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]">&gt;_</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-white font-black text-sm tracking-tight">SOCIAL SUITE</span>
              <span className="text-yellow-500/80 font-black text-[9px] uppercase tracking-widest mt-0.5">RantiDevs <span className="text-slate-500">PRO</span></span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="hidden md:flex items-center gap-8"
          >
            {["Features", "Analytics", "Pricing"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-sm text-slate-400 hover:text-yellow-500 transition-colors font-medium">
                {item}
              </a>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-3"
          >
            <button
              onClick={() => navigate("/dashboard")}
              className="text-sm text-slate-400 hover:text-white transition-colors font-medium px-4 py-2"
            >
              Sign In
            </button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 rounded-lg bg-yellow-500 text-slate-950 text-sm font-black shadow-lg shadow-yellow-500/20"
            >
              GET STARTED
            </motion.button>
          </motion.div>
        </div>
      </motion.nav>

      {/* ── Hero Section ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Radial glow background */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[900px] h-[600px] rounded-full bg-violet-600/10 blur-[120px]" />
          <div className="absolute w-[500px] h-[400px] rounded-full bg-indigo-600/12 blur-[80px] -translate-y-20" />
        </div>

        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 max-w-7xl mx-auto px-6 pt-20 grid lg:grid-cols-2 gap-16 items-center"
        >
          {/* Left: Copy */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-sm font-black uppercase tracking-widest"
            >
              <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
              RantiDevs Ecosystem Enabled
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight"
            >
              Ultimate{" "}
              <span className="bg-gradient-to-r from-yellow-500 via-yellow-200 to-white bg-clip-text text-transparent">
                Social Multi-Suite
              </span>{" "}
              for{" "}
              <span className="relative">
                Growth
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 1.1, duration: 0.6 }}
                  className="absolute -bottom-1 left-0 right-0 h-1 bg-yellow-500 rounded-full origin-left"
                />
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-slate-400 leading-relaxed max-w-lg"
            >
              Master Instagram, Twitter, and Mass Outreach from a single dashboard. Automated scraping, DM campaigns, and advanced analytics for the modern digital empire.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(139,92,246,0.5)" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/dashboard")}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-500 text-white font-bold text-base shadow-lg shadow-violet-500/30 flex items-center gap-2"
              >
                Start Analyzing Free
                <span>→</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/purchase-crypto")}
                className="px-8 py-4 rounded-xl border border-white/10 text-white font-semibold text-base hover:bg-white/5 flex items-center gap-2 backdrop-blur-sm"
              >
                <span className="text-amber-400">₿</span> Buy with Crypto
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="flex items-center gap-6 text-sm text-slate-500"
            >
              {["No credit card required", "24h license delivery", "Multi-account support"].map((t, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <span className="text-emerald-400">✓</span> {t}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right: 3D Mockup */}
          <div className="flex justify-center">
            <FloatingMockup />
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-xs text-slate-500 uppercase tracking-widest">Scroll to explore</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center pt-1.5"
          >
            <div className="w-1 h-2 rounded-full bg-violet-400" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── Marquee ── */}
      <div className="border-y border-white/5 py-2 z-10 relative">
        <Marquee />
      </div>

      {/* ── Stats Section ── */}
      <section className="relative z-10 py-24 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <StatCounter value="50M+" label="Reels Tracked" />
          <StatCounter value="12000+" label="Creators Analyzed" />
          <StatCounter value="99.9%" label="API Uptime" suffix="%" />
          <StatCounter value="6" label="Crypto Currencies" />
        </div>
      </section>

      {/* ── Features Section ── */}
      <section id="features" className="relative z-10 py-24 max-w-7xl mx-auto px-6">
        <RevealText className="text-center mb-16">
          <div className="text-sm font-semibold text-violet-400 uppercase tracking-widest mb-3">Everything You Need</div>
          <h2 className="text-5xl font-black">
            Built for{" "}
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              serious creators
            </span>
          </h2>
          <p className="mt-4 text-slate-400 max-w-xl mx-auto">
            From real-time scraping to multi-account analytics — every feature is crafted for Instagram power users.
          </p>
        </RevealText>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { icon: "📸", title: "Instagram Growth Engine", desc: "Real-time scraping of reels, followers, and engagement metrics. Track competitors and identify viral trends instantly.", gradient: "from-violet-500 to-indigo-500", delay: 0 },
            { icon: "🐦", title: "Twitter X Data Miner", desc: "Scrape tweets, threads, and user profiles with custom filters. Export leads and analyze sentiment at scale.", gradient: "from-cyan-500 to-blue-500", delay: 0.1 },
            { icon: "🚀", title: "Mass Outreach OS", desc: "Automate your cold outreach with high-volume DM campaigns. Manage multiple accounts and proxies with ease.", gradient: "from-emerald-500 to-teal-500", delay: 0.2 },
            { icon: "₿", title: "Global Crypto Payments", desc: "Purchase premium access using Bitcoin, Ethereum, and 50+ other cryptocurrencies via our secure gateway.", gradient: "from-amber-500 to-orange-500", delay: 0.3 },
            { icon: "🔐", title: "Enterprise Security", desc: "Advanced session management, two-factor authentication, and secure proxy rotation for maximum account safety.", gradient: "from-pink-500 to-rose-500", delay: 0.4 },
            { icon: "💎", title: "Multi-Platform Dashboard", desc: "A unified command center for all your social assets. Switch between platforms in a single click.", gradient: "from-fuchsia-500 to-purple-500", delay: 0.5 },
          ].map((f, i) => (
            <FeatureCard key={i} {...f} />
          ))}
        </div>
      </section>

      {/* ── Carousel Section ── */}
      <section id="analytics" className="relative z-10 py-24 bg-gradient-to-b from-transparent via-violet-950/10 to-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <RevealText className="mb-10">
            <div className="text-sm font-semibold text-violet-400 uppercase tracking-widest mb-3">Platform Features</div>
            <h2 className="text-4xl font-black">Explore Every Module</h2>
          </RevealText>
          <Carousel />
        </div>
      </section>

      {/* ── Visual Analytics Preview ── */}
      <section className="relative z-10 py-24 max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <RevealText delay={0}>
            <div className="text-sm font-semibold text-cyan-400 uppercase tracking-widest mb-3">Analytics Engine</div>
            <h2 className="text-5xl font-black mb-6">
              Data that drives{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                decisions
              </span>
            </h2>
            <div className="space-y-4 text-slate-400">
              {[
                "Track engagement rate trends across all your reels",
                "Benchmark content performance against your average",
                "Identify which captions, hashtags, and post times perform best",
                "Export full analytics data to CSV on demand",
              ].map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center text-xs text-white flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  {t}
                </motion.div>
              ))}
            </div>
          </RevealText>

          {/* Animated chart */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-cyan-600/20 to-indigo-600/20 blur-2xl" />
            <div className="relative rounded-2xl border border-white/8 bg-slate-900/80 backdrop-blur-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-lg font-bold text-white">Engagement Overview</div>
                  <div className="text-sm text-slate-400">Last 30 days • All accounts</div>
                </div>
                <div className="text-2xl font-black text-emerald-400">+24.8%</div>
              </div>
              <div className="flex items-end gap-2 h-32">
                {[35, 55, 45, 70, 50, 85, 65, 90, 60, 95, 80, 100, 75, 88, 70].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${h}%` }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04 + 0.2, duration: 0.6 }}
                    className="flex-1 rounded-t-sm bg-gradient-to-t from-indigo-600/80 to-cyan-400/80"
                  />
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { label: "Avg. Views", val: "124K", trend: "+12%" },
                  { label: "Avg. Likes", val: "8.2K", trend: "+7%" },
                  { label: "Avg. Comments", val: "342", trend: "+31%" },
                ].map((s, i) => (
                  <div key={i} className="rounded-lg bg-slate-800/50 p-3">
                    <div className="text-xs text-slate-400">{s.label}</div>
                    <div className="text-base font-bold text-white">{s.val}</div>
                    <div className="text-xs text-emerald-400">{s.trend}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Pricing Section ── */}
      <section id="pricing" className="relative z-10 py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-950/15 to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto px-6">
          <RevealText className="text-center mb-16">
            <div className="text-sm font-semibold text-violet-400 uppercase tracking-widest mb-3">Pricing</div>
            <h2 className="text-5xl font-black">Simple, transparent pricing</h2>
            <p className="mt-4 text-slate-400">Pay monthly. Cancel anytime. Crypto always welcome.</p>
          </RevealText>

          <div className="grid md:grid-cols-3 gap-6">
            <PricingCard
              plan="Starter"
              price="29"
              features={[
                "Single Platform (IG or Twitter)",
                "Daily Data Refresh",
                "Basic DM Automation",
                "Email Support",
              ]}
              delay={0}
            />
            <PricingCard
              plan="Pro Suite"
              price="79"
              highlighted
              features={[
                "All Platforms (IG + Twitter)",
                "Real-time Data Scraping",
                "Unlimited DM Campaigns",
                "Priority 24/7 Support",
                "Custom Export Formats",
              ]}
              delay={0.1}
            />
            <PricingCard
              plan="Agency"
              price="199"
              features={[
                "Unlimited Platform Accounts",
                "Multi-user Team Access",
                "White-label Reports",
                "API Direct Access",
                "Dedicated Account Manager",
              ]}
              delay={0.2}
            />
          </div>

          <RevealText delay={0.3} className="mt-10 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
              <span className="text-lg">₿</span>
              <span>Prefer crypto? Pay with Bitcoin, Ethereum, USDT, and more via NowPayments.</span>
              <button
                onClick={() => navigate("/purchase-crypto")}
                className="ml-2 text-amber-400 underline underline-offset-2 font-semibold"
              >
                Pay with crypto →
              </button>
            </div>
          </RevealText>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="relative z-10 py-32 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <div className="absolute -inset-8 rounded-3xl bg-gradient-to-r from-violet-600/25 via-indigo-600/20 to-cyan-600/25 blur-3xl" />
          <div className="relative rounded-3xl border border-white/8 bg-slate-900/70 backdrop-blur-xl p-16">
            <div className="text-sm font-semibold text-violet-400 uppercase tracking-widest mb-4">Ready to level up?</div>
            <h2 className="text-5xl font-black mb-6">
              Start tracking Instagram{" "}
              <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                today
              </span>
            </h2>
            <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
              Join thousands of creators using our analytics dashboard to grow their Instagram presence.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.06, boxShadow: "0 0 60px rgba(139,92,246,0.5)" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/dashboard")}
                className="px-10 py-4 rounded-xl bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-500 text-white font-bold text-base shadow-2xl shadow-violet-500/40"
              >
                Launch Dashboard →
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/purchase-crypto")}
                className="px-10 py-4 rounded-xl border border-white/10 text-white font-semibold text-base hover:bg-white/5 backdrop-blur-sm"
              >
                Buy License
              </motion.button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/5 py-12 max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-black">
              IG
            </div>
            <span className="font-bold text-white">Analytics</span>
          </div>
          <div className="flex gap-8 text-sm text-slate-500">
            {["Features", "Pricing", "Sign In"].map((item) => (
              <a key={item} href="#" className="hover:text-white transition-colors">{item}</a>
            ))}
          </div>
          <div className="text-sm text-slate-600">
            © {new Date().getFullYear()} IG Analytics. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
