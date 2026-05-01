"use client";
import { logger } from "@/lib/logger";

import { useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Download, Upload } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface ConfigParam {
  key: string;
  readonly: boolean;
  value: string;
}

interface ChargerConfigurationPanelProps {
  chargerId: number;
}

export function ChargerConfigurationPanel({ chargerId }: ChargerConfigurationPanelProps) {
  const [configs, setConfigs] = useState<ConfigParam[]>([]);
  const [editedValues, setEditedValues] = useState<{ [key: string]: string }>({});
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchConfiguration = async () => {
    setIsLoading(true);
    try {
      const response = await api.post('/ocpp/get-configuration', { chargerId });
      if (response.data.status === 'Accepted' && response.data.configurationKey) {
        setConfigs(response.data.configurationKey);
        // Reset state
        setEditedValues({});
        setSelectedKeys(new Set());
      } else {
        alert(response.data.error || 'Failed to fetch configuration');
      }
    } catch (error: any) {
      logger.error('Failed to get configuration', error);
      alert(error.response?.data?.error || 'Failed to fetch configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleValueChange = (key: string, value: string) => {
    setEditedValues(prev => ({ ...prev, [key]: value }));
    // Auto-select when a value is edited
    setSelectedKeys(prev => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  };

  const toggleSelection = (key: string) => {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const submitSelected = async () => {
    if (selectedKeys.size === 0) return;

    setIsSubmitting(true);
    try {
      const configurationKey = Array.from(selectedKeys).map(key => {
        // Fallback to original value if not edited
        const originalConfig = configs.find(c => c.key === key);
        const value = editedValues[key] !== undefined ? editedValues[key] : (originalConfig?.value || "");
        return { key, value };
      });

      const response = await api.post('/ocpp/set-configuration', {
        chargerId,
        configurationKey
      });

      alert(`Set Configuration result: ${response.data.status || 'Accepted'}`);

      // Refresh configurations to see applied changes
      await fetchConfiguration();
    } catch (error: any) {
      logger.error('Failed to set configuration', error);
      alert(error.response?.data?.error || 'Failed to set configuration');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b pb-4 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl">Configuration Parameters</CardTitle>
          <CardDescription>View and modify specific charger parameters.</CardDescription>
        </div>
        <Button onClick={fetchConfiguration} disabled={isLoading} variant="outline" size="sm">
          {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
          Get Parameters
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        {configs.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground border-dashed border-2 rounded-lg">
            <p>No configuration parameters loaded.</p>
            <p className="text-sm mt-1">Click &quot;Get Parameters&quot; to request them from the charger.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Access</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configs.map((config) => {
                    const isSelected = selectedKeys.has(config.key);
                    const currentValue = editedValues[config.key] !== undefined ? editedValues[config.key] : config.value || "";

                    return (
                      <TableRow key={config.key} className={isSelected ? "bg-muted/50" : ""}>
                        <TableCell>
                          {!config.readonly && (
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelection(config.key)}
                            />
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs max-w-[200px] truncate" title={config.key}>
                          {config.key}
                        </TableCell>
                        <TableCell>
                          {config.readonly ? (
                            <Badge variant="outline" className="text-xs">Read-Only</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">R/W</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {config.readonly ? (
                            <div className="font-mono text-xs break-all max-w-md">{config.value}</div>
                          ) : (
                            <Input
                              value={currentValue}
                              onChange={(e) => handleValueChange(config.key, e.target.value)}
                              className="font-mono text-xs h-8"
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between items-center bg-muted/30 p-4 rounded-lg border">
              <span className="text-sm font-medium">
                {selectedKeys.size} parameter(s) selected
              </span>
              <Button
                onClick={submitSelected}
                disabled={selectedKeys.size === 0 || isSubmitting}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                Send Selected Values
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
