"use client"

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  Download,
  DoorOpen
} from 'lucide-react';
import { MOCK_ROOM_LOGS } from '@/lib/placeholder-data';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function RoomLogsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredLogs = MOCK_ROOM_LOGS.filter(log => 
    log.professorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.roomId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDateTime = (dateString: string) => {
    if (!mounted) return { date: "", time: "" };
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold text-foreground">Room Logs</h1>
            <p className="text-muted-foreground">Historical laboratory usage and session tracking.</p>
          </div>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export Report
          </Button>
        </header>

        <Card className="border-none shadow-md">
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by professor name or room..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filter:</span>
                </div>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Professor</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => {
                  const dt = formatDateTime(log.timestamp);
                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {dt.date}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {dt.time}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{log.professorName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex w-fit items-center gap-1 font-mono">
                          <DoorOpen size={12} />
                          {log.roomId}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.endTime ? (
                          <span className="text-sm text-muted-foreground">
                            {mounted ? Math.round((new Date(log.endTime).getTime() - new Date(log.timestamp).getTime()) / 60000) : "..."} mins
                          </span>
                        ) : (
                          <span className="text-sm font-medium text-green-600 animate-pulse">In Progress</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={log.status === 'Active' ? 'default' : 'secondary'}
                          className={log.status === 'Active' ? 'bg-green-500 hover:bg-green-600' : ''}
                        >
                          {log.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
