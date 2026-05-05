"use client";

import React, { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { logger } from "@/lib/logger";

interface ChannelLog {
  id: string;
  timestamp: Date;
  chargePointId: string;
  messageType: string;
  action: string;
  payload: any;
  power?: number;
  energy?: number;
  card?: string;
  client?: string;
  transactionTime?: string;
  direction?: string;
}

interface ChannelLogsProps {
  chargerId: number;
  connectorId: number;
}

export function ChannelLogs({ chargerId, connectorId }: ChannelLogsProps) {
  const [logs, setLogs] = useState<ChannelLog[]>([]);
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const toggleRow = (id: string) => {
    setExpandedRowIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const enrichLog = useCallback((rawLog: any): ChannelLog | null => {
    let parsedMsg: any = null;
    let messageType = rawLog.direction === 'in' ? 'RX' : 'TX';
    let action = rawLog.action || '-';
    let payload = rawLog.message;

    try {
      if (typeof rawLog.message === 'string') {
        parsedMsg = JSON.parse(rawLog.message);
      } else {
        parsedMsg = rawLog.message;
      }
    } catch {
      // Not JSON
    }

    if (Array.isArray(parsedMsg)) {
      const typeId = parsedMsg[0];
      if (typeId === 2) {
        messageType = 'CALL';
        action = parsedMsg[2];
        payload = parsedMsg[3];
      } else if (typeId === 3) {
        messageType = 'CALLRESULT';
        payload = parsedMsg[2];
      } else if (typeId === 4) {
        messageType = 'CALLERROR';
        action = parsedMsg[2];
        payload = {
          errorCode: parsedMsg[2],
          errorDescription: parsedMsg[3],
          errorDetails: parsedMsg[4]
        };
      }
    } else if (parsedMsg && typeof parsedMsg === 'object') {
      if (action === '-' && rawLog.direction === 'in') {
        if (parsedMsg.chargePointVendor) action = 'BootNotification';
        else if (parsedMsg.meterStart !== undefined || (parsedMsg.idTag && parsedMsg.connectorId)) action = 'StartTransaction';
        else if (parsedMsg.meterStop !== undefined) action = 'StopTransaction';
        else if (parsedMsg.meterValue) action = 'MeterValues';
        else if (parsedMsg.status && parsedMsg.errorCode) action = 'StatusNotification';
        else if (parsedMsg.idTag) action = 'Authorize';
      }
      payload = parsedMsg;
    }

    let enhancedAction = action;
    if (action === 'BootNotification') enhancedAction = 'OCPP boot notification';
    if (action === 'Heartbeat') enhancedAction = 'OCPP heartbeat';
    if (action === 'StatusNotification') {
      if (payload?.status === 'Available') enhancedAction = 'Ready';
      else if (payload?.status === 'Charging') enhancedAction = 'Charging';
      else if (payload?.status === 'Preparing') enhancedAction = 'Preparing transaction';
      else if (payload?.status === 'Finishing') enhancedAction = 'Finishing transaction';
      else if (payload?.status === 'SuspendedEVSE') enhancedAction = 'Charging (no available power)';
      else if (payload?.status === 'SuspendedEV') enhancedAction = 'Charging (full)';
      else enhancedAction = 'OCPP status notification';
    }
    if (action === 'Authorize') enhancedAction = 'OCPP authorization';
    if (action === 'StartTransaction') enhancedAction = 'OCPP start transaction';
    if (action === 'StopTransaction') enhancedAction = 'Commit transaction';
    if (action === 'MeterValues') enhancedAction = 'OCPP meter values';

    let logPower: number | undefined;
    let logEnergy: number | undefined;
    let logCard: string | undefined;

    if (action === 'Authorize' || action === 'StartTransaction') {
      logCard = payload?.idTag;
    }
    if (action === 'StopTransaction') {
      logCard = payload?.idTag;
    }

    if (action === 'MeterValues' && payload?.meterValue) {
      const meterValuesArray = Array.isArray(payload.meterValue) ? payload.meterValue : [];
      for (const mv of meterValuesArray) {
        if (mv.sampledValue && Array.isArray(mv.sampledValue)) {
          for (const sv of mv.sampledValue) {
            const measurand = sv.measurand || "Energy.Active.Import.Register";
            if (measurand === "Energy.Active.Import.Register" || measurand === "Energy") {
              logEnergy = parseFloat(sv.value) / 1000;
            } else if (measurand === "Power.Active.Import" || measurand === "Power") {
              logPower = parseFloat(sv.value) / 1000;
            }
          }
        } else if (mv.value !== undefined) {
           logEnergy = parseFloat(mv.value) / 1000;
        }
      }
    }

    // Filter by connectorId only if explicitly targeting another non-zero connector
    if (payload?.connectorId !== undefined && payload.connectorId !== 0 && payload.connectorId !== connectorId) {
       return null;
    }

    // Check evseId for OCPP 2.0.1
    if (payload?.evseId !== undefined && payload.evseId !== connectorId && payload?.evse?.id !== connectorId) {
         return null;
    }

    return {
      id: rawLog.id?.toString() || Math.random().toString(36).substring(7),
      timestamp: new Date(rawLog.timestamp),
      chargePointId: rawLog.charger?.name || rawLog.chargerId?.toString() || chargerId.toString(),
      messageType,
      action: enhancedAction,
      payload,
      power: logPower,
      energy: logEnergy,
      card: logCard,
      direction: rawLog.direction
    };
  }, [chargerId, connectorId]);

  useEffect(() => {
    const fetchHistoricalLogs = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/chargers/${chargerId}/logs`);
        const historicalLogs = (response.data || [])
          .map(enrichLog)
          .filter(Boolean) as ChannelLog[];
        setLogs(historicalLogs.slice(0, 50));
      } catch (error) {
        logger.error("Failed to fetch historical logs", error);
      } finally {
        setIsLoading(false);
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
             const newLog = enrichLog(data.log);
             if (newLog) {
               setLogs(prev => [newLog, ...prev].slice(0, 50));
             }
          }
        } catch {
          // parse error
        }
      };
    } catch (err) {
      logger.error("Failed to connect to OCPP logs WS", err);
    }

    return () => {
      if (ws) ws.close();
    };
  }, [chargerId, enrichLog]);

  return (
    <div className="mt-4 border rounded-md border-zinc-800 overflow-hidden bg-zinc-950">
      <div className="bg-zinc-900 px-4 py-2 flex gap-4 text-sm border-b border-zinc-800 overflow-x-auto whitespace-nowrap text-zinc-300">
        <span>Channel {connectorId}&apos;s log:</span>
      </div>
      <Table>
        <TableHeader className="sticky top-0 bg-zinc-900 z-10">
          <TableRow className="border-zinc-800 hover:bg-zinc-900">
            <TableHead className="text-zinc-400">Date</TableHead>
            <TableHead className="text-zinc-400">Notification</TableHead>
            <TableHead className="text-zinc-400">Power (kW)</TableHead>
            <TableHead className="text-zinc-400">Energy (kWh)</TableHead>
            <TableHead className="text-zinc-400">Transaction time</TableHead>
            <TableHead className="text-zinc-400">Card</TableHead>
            <TableHead className="text-zinc-400">Client</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && logs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-zinc-500">Loading channel logs...</TableCell>
            </TableRow>
          ) : logs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-zinc-500">
                No logs available for this channel
              </TableCell>
            </TableRow>
          ) : (
            logs.map((log) => (
              <React.Fragment key={log.id}>
                <TableRow
                  className="border-zinc-800/50 hover:bg-zinc-800/50 font-mono text-xs cursor-pointer"
                  onClick={() => toggleRow(log.id)}
                >
                  <TableCell className="text-zinc-400 whitespace-nowrap">
                    {format(log.timestamp, 'dd-MMM-yyyy HH:mm:ss')}
                  </TableCell>
                  <TableCell className="text-zinc-300">
                    {log.action || '-'}
                  </TableCell>
                  <TableCell className="text-zinc-300">
                    {log.power !== undefined ? log.power.toFixed(2) : ''}
                  </TableCell>
                  <TableCell className="text-zinc-300">
                    {log.energy !== undefined ? log.energy.toFixed(2) : ''}
                  </TableCell>
                  <TableCell className="text-zinc-300">
                    {log.transactionTime || ''}
                  </TableCell>
                  <TableCell className="text-blue-400">
                    {log.card ? (
                      <span className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-rss"><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg>
                        {log.card}
                      </span>
                    ) : ''}
                  </TableCell>
                  <TableCell className="text-blue-400">
                    {log.client || ''}
                  </TableCell>
                </TableRow>
                {expandedRowIds.has(log.id) && (
                  <TableRow className="border-zinc-800/50 hover:bg-zinc-800/50">
                    <TableCell colSpan={7} className="p-0 border-b border-zinc-800/50">
                      <div className="bg-zinc-950/50 p-4 font-mono text-xs whitespace-pre-wrap break-words break-all text-zinc-400">
                        {log.messageType && <div className="mb-2 text-purple-400">Type: {log.messageType}</div>}
                        {JSON.stringify(log.payload, null, 2)}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
