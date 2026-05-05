"use client";
import React from "react";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Zap, CheckCircle2, XCircle, Clock, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { ChannelLogs } from "./ChannelLogs";

interface Connector {
  connector_id: number;
  connector_name: string;
  status: string;
  current_type: string;
  max_power: number;
  max_current?: number;
  charger_id?: number;
}

interface ConnectorListProps {
  connectors: Connector[];
}

function getStatusIcon(status: string) {
  const s = status?.toLowerCase() || '';
  if (s === 'available') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  if (s === 'charging') return <Zap className="h-4 w-4 text-blue-500 animate-pulse" />;
  if (s === 'faulted') return <AlertTriangle className="h-4 w-4 text-red-500" />;
  return <XCircle className="h-4 w-4 text-muted-foreground" />;
}

function getStatusColor(status: string) {
  const s = status?.toLowerCase() || '';
  if (s === 'available') return 'bg-green-500/10 text-green-500 border-green-500/20';
  if (s === 'charging') return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
  if (s === 'faulted') return 'bg-red-500/10 text-red-500 border-red-500/20';
  if (s === 'reserved') return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
  if (s === 'unavailable') return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
  return 'bg-muted text-muted-foreground';
}

export function ConnectorList({ connectors }: ConnectorListProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [activeTxns, setActiveTxns] = useState<any[]>([]);
  const [now, setNow] = useState(Date.now());

  React.useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    const chargerId = connectors[0]?.charger_id;
    if (!chargerId) return;

    const fetchActiveTxns = async () => {
      try {
        const { api } = await import('@/lib/api');
        const response = await api.get(`/transactions/charger/${chargerId}`);
        const payload = response.data;
        let allTxns: any[] = [];
        if (payload && payload.data) {
          const basicTxns = Array.isArray(payload.data.transactions) ? payload.data.transactions : [];
          const rfidTxns = Array.isArray(payload.data.rfidSessions) ? payload.data.rfidSessions : [];
          const basicTxnIds = new Set(basicTxns.map((t: any) => t.transactionId));
          const uniqueRfidTxns = rfidTxns.filter((s: any) => !basicTxnIds.has(s.transactionId));
          allTxns = [...basicTxns, ...uniqueRfidTxns];
        } else if (payload && (payload.transactions || payload.rfidSessions)) {
          const basicTxns = Array.isArray(payload.transactions) ? payload.transactions : [];
          const rfidTxns = Array.isArray(payload.rfidSessions) ? payload.rfidSessions : [];
          const basicTxnIds = new Set(basicTxns.map((t: any) => t.transactionId));
          const uniqueRfidTxns = rfidTxns.filter((s: any) => !basicTxnIds.has(s.transactionId));
          allTxns = [...basicTxns, ...uniqueRfidTxns];
        }

        setActiveTxns(allTxns.filter(t => t.status === 'charging' || t.status === 'Preparing' || t.endTime === null));
      } catch (err) {
        // silently fail
      }
    };

    fetchActiveTxns();
    const interval = setInterval(fetchActiveTxns, 3000);
    return () => clearInterval(interval);
  }, [connectors]);

  const formatDuration = (start: string | Date) => {
    if (!start) return '00:00:00';
    const diff = now - new Date(start).getTime();
    if (diff < 0) return '00:00:00';
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!connectors || connectors.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground border border-dashed rounded-lg flex flex-col items-center gap-2">
        <Clock className="h-8 w-8 text-muted-foreground/50" />
        <p>No connectors configured for this charger.</p>
        <p className="text-xs">Connectors will be auto-created when the charger connects.</p>
      </div>
    );
  }

  const availableCount = connectors.filter(c => c.status?.toLowerCase() === 'available').length;
  const chargingCount = connectors.filter(c => c.status?.toLowerCase() === 'charging').length;
  const faultedCount = connectors.filter(c => c.status?.toLowerCase() === 'faulted').length;

  const toggleExpand = (id: number) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 text-sm">
        <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
          {availableCount} Available
        </Badge>
        <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
          {chargingCount} Charging
        </Badge>
        <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
          {faultedCount} Faulted
        </Badge>
        <Badge variant="outline">
          {connectors.length} Total
        </Badge>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"></TableHead>
            <TableHead>Ch#</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Notification</TableHead>
            <TableHead>Power (kW)</TableHead>
            <TableHead>Energy (kWh)</TableHead>
            <TableHead>Transaction time</TableHead>
            <TableHead>Card</TableHead>
            <TableHead>Client</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {connectors.map((conn) => (
            <React.Fragment key={conn.connector_id}>
              <TableRow
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleExpand(conn.connector_id)}
              >
                <TableCell>
                  {expandedId === conn.connector_id ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  {conn.connector_id}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center">
                    {conn.status?.toLowerCase() === 'charging' ? (
                      <div className="w-6 h-6 rounded-full bg-blue-600 border border-blue-900" />
                    ) : conn.status?.toLowerCase() === 'available' ? (
                      <div className="w-6 h-6 rounded-full bg-green-500 border border-green-800" />
                    ) : conn.status?.toLowerCase() === 'faulted' ? (
                      <div className="w-6 h-6 rounded-full bg-red-500 border border-red-800" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-500 border border-gray-800" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {conn.status}
                </TableCell>
                {(() => {
                  const activeTxn = activeTxns.find(t => t.connectorName === String(conn.connector_id) || t.connectorName === conn.connector_name);
                  const isCharging = conn.status?.toLowerCase() === 'charging' || activeTxn;

                  if (isCharging && activeTxn) {
                    const power = activeTxn.currentPower ? (activeTxn.currentPower / 1000).toFixed(2) : '0.00';
                    const energy = activeTxn.energyConsumed ? (activeTxn.energyConsumed / 1000).toFixed(2) : '0.00';
                    const duration = formatDuration(activeTxn.startTime || activeTxn.createdAt);
                    const card = activeTxn.idTag || activeTxn.rfidUser?.rfid_tag || '';
                    const client = activeTxn.rfidUser?.name || '';

                    return (
                      <>
                        <TableCell className="text-zinc-300">{power}</TableCell>
                        <TableCell className="text-zinc-300">{energy}</TableCell>
                        <TableCell className="text-zinc-300">{duration}</TableCell>
                        <TableCell className="text-blue-400">
                          {card ? (
                            <span className="flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-rss"><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg>
                              {card}
                            </span>
                          ) : ''}
                        </TableCell>
                        <TableCell className="text-blue-400">{client}</TableCell>
                      </>
                    );
                  }

                  return (
                    <>
                      <TableCell className="text-zinc-300"></TableCell>
                      <TableCell className="text-zinc-300"></TableCell>
                      <TableCell className="text-zinc-300"></TableCell>
                      <TableCell className="text-blue-400"></TableCell>
                      <TableCell className="text-blue-400"></TableCell>
                    </>
                  );
                })()}
              </TableRow>
              {expandedId === conn.connector_id && (
                <TableRow>
                  <TableCell colSpan={7} className="p-0 border-b-0 bg-muted/10">
                    <div className="p-4 pt-0">
                      <ChannelLogs
                        chargerId={conn.charger_id || 0}
                        connectorId={conn.connector_id}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
