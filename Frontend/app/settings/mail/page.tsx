"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MailSettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [config, setConfig] = useState({
    host: "",
    port: 587,
    username: "",
    password: "",
    fromAddress: "",
    isActive: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== "admin") {
        router.push("/dashboard");
      } else {
        fetchConfig();
      }
    }
  }, [user, authLoading, router]);

  const fetchConfig = async () => {
    try {
      const response = await api.get("/mail/config");
      if (response.data) {
        setConfig(response.data.data);
      }
    } catch (error) {
      console.error("Failed to load mail config", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setConfig({
      ...config,
      [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put("/mail/config", config);
      toast.success("Mail configuration saved!");
    } catch (error) {
      toast.error("Failed to save mail configuration");
    }
  };

  if (authLoading || loading) {
    return (
      <AppShell>
        <div className="p-6">Loading...</div>
      </AppShell>
    );
  }

  if (!user || user.role !== "admin") {
    return null; // Will redirect
  }

  return (
    <AppShell>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Mail Configuration</h1>
          <Link href="/settings/templates">
            <Button variant="outline">Manage Mail Templates</Button>
          </Link>
        </div>
        <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <div>
          <label className="block text-sm font-medium">SMTP Host</label>
          <input
            type="text"
            name="host"
            value={config.host || ""}
            onChange={handleChange}
            className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">SMTP Port</label>
          <input
            type="number"
            name="port"
            value={config.port || 587}
            onChange={handleChange}
            className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">SMTP Username</label>
          <input
            type="text"
            name="username"
            value={config.username || ""}
            onChange={handleChange}
            className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">SMTP Password</label>
          <input
            type="password"
            name="password"
            value={config.password || ""}
            onChange={handleChange}
            className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">From Address</label>
          <input
            type="email"
            name="fromAddress"
            value={config.fromAddress || ""}
            onChange={handleChange}
            className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2"
            required
          />
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            name="isActive"
            checked={config.isActive}
            onChange={handleChange}
            className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm">Active</label>
        </div>
          <Button type="submit">
            Save Configuration
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
