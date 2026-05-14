interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: string;
  color: string;
}

export default function StatCard({ title, value, change, changeType, icon, color }: StatCardProps) {
  const changeColorClass = changeType === 'positive' 
    ? 'bg-gradient-to-r from-green-500/15 to-emerald-500/10 text-green-600 dark:text-green-400 border border-green-500/20' 
    : changeType === 'negative'
    ? 'bg-gradient-to-r from-red-500/15 to-orange-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
    : 'bg-gradient-to-r from-blue-500/15 to-cyan-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';

  return (
    <div className="group relative bg-gradient-to-br from-card/90 to-card/60 backdrop-blur-xl rounded-2xl border border-border/40 p-6 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/30 transition-all duration-500 hover:scale-105 overflow-hidden" data-testid={`stat-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="relative flex items-center justify-between">
        <div className="flex-1">
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2">{title}</p>
          <p className="text-4xl font-black mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent" data-testid={`stat-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>{value}</p>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${changeColorClass}`}>
              {changeType !== 'neutral' && (
                <i className={`fas fa-arrow-${changeType === 'positive' ? 'up' : 'down'} text-xs`}></i>
              )}
              {change}
            </div>
          </div>
        </div>
        <div className={`relative w-16 h-16 ${color} rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-500`}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
          <i className={`${icon} text-2xl ${color.replace('bg-', 'text-').replace('/10', '')} relative z-10`}></i>
        </div>
      </div>
    </div>
  );
}
