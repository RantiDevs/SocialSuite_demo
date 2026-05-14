export default function ScraperStatus() {
  return (
    <div className="bg-card rounded-lg border border-border p-6" data-testid="scraper-status">
        <h3 className="text-lg font-semibold mb-4">Current Status</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg" data-testid="status-instagram-connection">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-chart-4 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Instagram Connection</span>
            </div>
            <span className="text-sm text-chart-4">Active</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg" data-testid="status-database">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-chart-3 rounded-full"></div>
              <span className="text-sm font-medium">Database Status</span>
            </div>
            <span className="text-sm text-chart-3">Connected</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg" data-testid="status-next-run">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-chart-5 rounded-full"></div>
              <span className="text-sm font-medium">Next Scheduled Run</span>
            </div>
            <span className="text-sm text-muted-foreground">22h 15m</span>
          </div>
          <div className="pt-2">
            <div className="flex justify-between text-sm mb-2">
              <span>Progress (Current Run)</span>
              <span className="text-muted-foreground" data-testid="current-run-status">Idle</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-chart-1 h-2 rounded-full transition-all duration-300" 
                style={{ width: "0%" }}
                data-testid="progress-bar"
              ></div>
            </div>
          </div>
        </div>
    </div>
  );
}
