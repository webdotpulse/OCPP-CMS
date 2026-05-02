"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ChannelLog {
  id: string;
  timestamp: string;
  notification: string;
  power: string;
  energy: string;
  transactionTime: string;
  card: string;
  client: string;
  type?: string;
  details?: any;
}

interface ChannelLogsProps {
  chargerId: number;
  connectorId: number;
}

export function ChannelLogs({ chargerId, connectorId }: ChannelLogsProps) {
  const [logs, setLogs] = useState<ChannelLog[]>([]);

  useEffect(() => {
    const parseLogPayload = (data: any): ChannelLog | null => {
      try {
        const message = typeof data.message === 'string' ? JSON.parse(data.message) : data.message;
        const payload = message[3] || {};

        if (payload.connectorId && payload.connectorId !== connectorId) {
          return null;
        }

        const action = message[2];

        return {
          id: data.id.toString(),
          timestamp: data.timestamp,
          notification: typeof action === 'string' ? action : "Response",
          power: payload.meterValue?.[0]?.sampledValue?.find((v:any) => v.measurand === 'Power.Active.Import')?.value || "",
          energy: payload.meterValue?.[0]?.sampledValue?.find((v:any) => v.measurand === 'Energy.Active.Import.Register')?.value || payload.meterStop || payload.meterStart || "",
          transactionTime: "",
          card: payload.idTag || "",
          client: ""
        };
      } catch {
        return null;
      }
    };

    const fetchHistoricalLogs = async () => {
      try {
        const response = await api.get(`/chargers/${chargerId}/logs`);
        const historicalLogs = (response.data || [])
          .map(parseLogPayload)
          .filter(Boolean) as ChannelLog[];
        setLogs(historicalLogs.slice(0, 50));
      } catch (error) {
        console.error("Failed to fetch historical logs", error);
      }
    };

    fetchHistoricalLogs();

    // Set up WebSocket connection for live logs
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/api/ocpp-logs`;
    let ws: WebSocket | null = null;

    try {
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'log' && data.log.chargerId === chargerId) {
             const newLog = parseLogPayload(data.log);
             if (newLog) {
               setLogs(prev => [newLog, ...prev].slice(0, 50));
             }
          }
        } catch {
          // parse error
        }
      };
    } catch (err) {
      console.error("Failed to connect to OCPP logs WS", err);
    }

    return () => {
      if (ws) ws.close();
    };
  }, [chargerId, connectorId]);

  return (
    <div className="mt-4 border rounded-md">
      <div className="bg-muted px-4 py-2 flex gap-4 text-sm border-b overflow-x-auto whitespace-nowrap">
        <span>Channel {connectorId}&apos;s log:</span>
        <button className="text-primary hover:underline">⇒Show detailed log items</button>
        <button className="text-primary hover:underline">⇒Show logged values</button>
        <button className="text-primary hover:underline">⇒Show more</button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Date</TableHead>
            <TableHead>Notification</TableHead>
            <TableHead>Power (kW)</TableHead>
            <TableHead>Energy (kWh)</TableHead>
            <TableHead>Transaction time</TableHead>
            <TableHead>Card</TableHead>
            <TableHead>Client</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id} className="h-10">
              <TableCell className="py-1">{format(new Date(log.timestamp), 'dd-MMM-yyyy HH:mm:ss')}</TableCell>
              <TableCell className="py-1">
                {log.notification}
              </TableCell>
              <TableCell className="py-1">{log.power}</TableCell>
              <TableCell className="py-1">{log.energy}</TableCell>
              <TableCell className="py-1">{log.transactionTime}</TableCell>
              <TableCell className="py-1">
                {log.card && <span className="text-blue-500 hover:underline cursor-pointer">{log.card}</span>}
              </TableCell>
              <TableCell className="py-1 text-blue-500 hover:underline cursor-pointer">
                {log.client}
              </TableCell>
            </TableRow>
          ))}
          {logs.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground h-24">
                No logs available for this channel
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
