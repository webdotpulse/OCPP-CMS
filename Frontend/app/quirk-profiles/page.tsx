"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Trash, Download, Upload, Save, Edit, Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface QuirkProfile {
  id: number;
  name: string;
  description: string | null;
  rules: any;
  createdAt: string;
}

export default function QuirkProfilesPage() {
  const [profiles, setProfiles] = useState<QuirkProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<QuirkProfile | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    rules: "{}",
  });

  const fetchProfiles = async () => {
    try {
      const response = await api.get("/quirk-profiles");
      setProfiles(response.data || []);
    } catch {
      toast.error("Failed to load profiles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleOpenDialog = (profile?: QuirkProfile) => {
    if (profile) {
      setEditingProfile(profile);
      setFormData({
        name: profile.name,
        description: profile.description || "",
        rules: JSON.stringify(profile.rules, null, 2),
      });
    } else {
      setEditingProfile(null);
      setFormData({
        name: "",
        description: "",
        rules: "{\n  \n}",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("Name is required");
      return;
    }

    let parsedRules;
    try {
      parsedRules = JSON.parse(formData.rules);
    } catch (e) {
      toast.error("Rules must be valid JSON");
      return;
    }

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        rules: parsedRules,
      };

      if (editingProfile) {
        await api.put(`/quirk-profiles/${editingProfile.id}`, payload);
        toast.success("Profile updated");
      } else {
        await api.post("/quirk-profiles", payload);
        toast.success("Profile created");
      }

      setIsDialogOpen(false);
      fetchProfiles();
    } catch {
      toast.error("Failed to save profile");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this profile?")) return;
    try {
      await api.delete(`/quirk-profiles/${id}`);
      toast.success("Profile deleted");
      fetchProfiles();
    } catch {
      toast.error("Failed to delete profile");
    }
  };

  const handleExport = (profile: QuirkProfile) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(profile, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${profile.name.replace(/\s+/g, '_')}_quirk_profile.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
            await api.post("/quirk-profiles/import", json);
            toast.success("Profiles imported successfully");
            fetchProfiles();
        } else if (json.name && json.rules) {
          await api.post("/quirk-profiles", {
            name: `${json.name} (Imported)`,
            description: json.description,
            rules: json.rules,
          });
          toast.success("Profile imported successfully");
          fetchProfiles();
        } else {
          toast.error("Invalid profile format");
        }
      } catch {
        toast.error("Failed to parse JSON");
      }
    };
    reader.readAsText(file);
    // reset file input
    e.target.value = '';
  };


  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Quirk Profiles</h2>
            <p className="text-muted-foreground">Manage hardware quirk resolution profiles.</p>
          </div>
          <div className="flex gap-2">
            <Label htmlFor="import-profile" className="cursor-pointer">
              <div className="flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground">
                <Upload className="w-4 h-4 mr-2" />
                Import Profile
              </div>
            </Label>
            <input
              id="import-profile"
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}><Plus className="w-4 h-4 mr-2" /> New Profile</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingProfile ? "Edit Profile" : "Create Profile"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Profile Name</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Ignore Missing MeterStart" />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Optional description..." />
                  </div>

                  <div className="space-y-2">
                    <Label>Rules (JSON)</Label>
                    <Textarea
                      value={formData.rules}
                      onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                      placeholder='{ "ignoreMeterStart": true }'
                      rows={10}
                      className="font-mono"
                    />
                  </div>

                  <div className="pt-4 flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave}><Save className="w-4 h-4 mr-2" /> Save Profile</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loading ? (
          <div>Loading profiles...</div>
        ) : profiles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No quirk profiles found. Create one to handle hardware anomalies.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profiles.map((profile) => (
              <Card key={profile.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{profile.name}</CardTitle>
                      {profile.description && <CardDescription>{profile.description}</CardDescription>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Button size="sm" variant="outline" onClick={() => handleOpenDialog(profile)}>
                      <Edit className="w-4 h-4 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleExport(profile)}>
                      <Download className="w-4 h-4 mr-1" /> Export
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(profile.id)}>
                      <Trash className="w-4 h-4 mr-1" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
