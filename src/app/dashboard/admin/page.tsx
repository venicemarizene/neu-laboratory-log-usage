"use client"

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  DoorOpen, 
  Ban, 
  TrendingUp, 
  BrainCircuit, 
  Clock, 
  Filter,
  Download,
  Calendar
} from 'lucide-react';
import { MOCK_ROOM_LOGS, MOCK_USERS } from '@/lib/placeholder-data';
import { generateLabUsageSummary, type GenerateLabUsageSummaryOutput } from '@/ai/flows/generate-lab-usage-summary';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AdminDashboard() {
  const [aiReport, setAiReport] = useState<GenerateLabUsageSummaryOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const stats = [
    { label: "Room Uses Today", value: "24", icon: <DoorOpen className="text-primary" />, trend: "+12%" },
    { label: "Active Professors", value: "8", icon: <Users className="text-accent" />, trend: "Normal" },
    { label: "Blocked Users", value: "3", icon: <Ban className="text-destructive" />, trend: "0 change" },
    { label: "Avg Session", value: "45m", icon: <Clock className="text-blue-500" />, trend: "-5m" },
  ];

  const handleGenerateAIReport = async () => {
    setIsGenerating(true);
    try {
      const result = await generateLabUsageSummary({
        logEntries: MOCK_ROOM_LOGS.map(log => ({
          professorId: log.professorId,
          roomId: log.roomId,
          timestamp: log.timestamp,
          endTime: log.endTime,
          status: log.status as 'Active' | 'Completed'
        })),
        timePeriod: 'Weekly'
      });
      setAiReport(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold text-foreground">Admin Overview</h1>
            <p className="text-muted-foreground">Laboratory analytics and management insights.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Calendar className="mr-2 h-4 w-4" />
              Custom Range
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <Card key={i} className="border-none shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                <div className="p-2 bg-muted/50 rounded-lg">{stat.icon}</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center text-xs mt-1">
                  <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                  <span className="text-green-500 font-medium">{stat.trend}</span>
                  <span className="text-muted-foreground ml-1">from yesterday</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area: Recent Activity */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Room Activity</CardTitle>
                  <CardDescription>Latest laboratory usage sessions across campus.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-primary font-medium">View All</Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {MOCK_ROOM_LOGS.map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {log.roomId}
                          </div>
                          <div>
                            <p className="font-medium">{log.professorName}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {log.endTime && ` - ${new Date(log.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                            </p>
                          </div>
                        </div>
                        <Badge variant={log.status === 'Active' ? 'default' : 'secondary'} className={log.status === 'Active' ? 'bg-green-500 hover:bg-green-600' : ''}>
                          {log.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* AI Insights Panel */}
          <div className="space-y-6">
            <Card className="border-none shadow-md bg-gradient-to-br from-primary to-accent text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <BrainCircuit size={120} />
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BrainCircuit className="h-6 w-6" />
                  AI Usage Summary
                </CardTitle>
                <CardDescription className="text-primary-foreground/70">
                  Generate intelligent insights from recent laboratory data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleGenerateAIReport}
                  disabled={isGenerating}
                  className="w-full bg-white text-primary hover:bg-white/90 font-bold h-11"
                >
                  {isGenerating ? "Analyzing Patterns..." : "Generate AI Insights"}
                </Button>

                {aiReport && (
                  <div className="mt-6 space-y-4 text-sm animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20">
                      <p className="font-semibold mb-1">Total Rooms Used: <span className="text-accent-foreground font-bold">{aiReport.totalRoomUses}</span></p>
                      <p className="text-white/80">{aiReport.summary}</p>
                    </div>
                    
                    <div>
                      <p className="font-bold text-xs uppercase tracking-wider mb-2 text-white/60">Peak Periods</p>
                      <div className="flex flex-wrap gap-2">
                        {aiReport.peakUsageTimes.map((time, idx) => (
                          <Badge key={idx} variant="secondary" className="bg-white/20 text-white border-none">{time}</Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="font-bold text-xs uppercase tracking-wider mb-2 text-white/60">Key Insights</p>
                      <ul className="list-disc list-inside space-y-1 text-white/90">
                        {aiReport.keyInsights.slice(0, 3).map((insight, idx) => (
                          <li key={idx} className="line-clamp-2">{insight}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-2">
                <Button variant="outline" className="justify-start">
                  <Filter className="mr-2 h-4 w-4" /> Filter Logs
                </Button>
                <Button variant="outline" className="justify-start">
                  <Users className="mr-2 h-4 w-4" /> Manage Professors
                </Button>
                <Button variant="outline" className="justify-start">
                  <Microscope className="mr-2 h-4 w-4" /> Room Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}