"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Save, Bell, Shield, Code, Settings2, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

const navItems = [
  { id: "general",       label: "General & Identity",     icon: Settings2 },
  { id: "funnel",        label: "Funnel Configuration",   icon: SlidersHorizontal },
  { id: "notifications", label: "Notification Rules",      icon: Bell },
  { id: "security",      label: "Security & API Keys",    icon: Shield },
  { id: "integrations",  label: "Integrations & SDK",     icon: Code },
];

function GeneralSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Workspace Identity</CardTitle>
          <CardDescription>Update the name and details for your monitoring workspace.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="workspace-name">Workspace Name</Label>
            <Input id="workspace-name" defaultValue="Drop-off IQ" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="workspace-url">Project URL</Label>
            <Input id="workspace-url" defaultValue="https://app.yourproduct.com/signup" />
          </div>
        </CardContent>
        <CardFooter className="border-t bg-muted/50 p-6 flex justify-end">
          <Button className="gap-2"><Save className="size-4" /> Save Changes</Button>
        </CardFooter>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
          <CardDescription>Irreversible actions that affect your data collection.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between border-l-2 border-destructive pl-4 py-2">
            <div>
              <p className="font-medium text-destructive">Reset Event Data</p>
              <p className="text-sm text-muted-foreground">Clear all historical event data for this environment.</p>
            </div>
            <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
              Reset Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FunnelSection() {
  const steps = [
    { id: "step-1", name: "Email & Password" },
    { id: "step-2", name: "Personal Details" },
    { id: "step-3", name: "Phone Verification" },
    { id: "step-4", name: "Complete" },
  ];
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Funnel Step Configuration</CardTitle>
          <CardDescription>Define the steps in your signup funnel and their display names.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center gap-3">
              <span className="text-sm font-mono text-muted-foreground w-12">{step.id}</span>
              <Input defaultValue={step.name} className="max-w-xs" />
              <Switch defaultChecked />
              <span className="text-xs text-muted-foreground">Active</span>
            </div>
          ))}
        </CardContent>
        <CardFooter className="border-t bg-muted/50 p-6 flex justify-end">
          <Button className="gap-2"><Save className="size-4" /> Save Steps</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Drop-off Thresholds</CardTitle>
          <CardDescription>Configure when a step is flagged as a high-friction point.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="dropoff-threshold">Drop-off Anomaly Threshold (%)</Label>
            <div className="flex items-center gap-3">
              <Input id="dropoff-threshold" type="number" defaultValue="15" className="w-24" />
              <p className="text-xs text-muted-foreground">Alert when drop-off rate exceeds 15% above the rolling average.</p>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="session-timeout">Session Idle Timeout (seconds)</Label>
            <div className="flex items-center gap-3">
              <Input id="session-timeout" type="number" defaultValue="120" className="w-24" />
              <p className="text-xs text-muted-foreground">Mark a user as idle after 120 seconds of no interaction.</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t bg-muted/50 p-6 flex justify-end">
          <Button className="gap-2"><Save className="size-4" /> Save Thresholds</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function NotificationSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Rules</CardTitle>
        <CardDescription>Manage how and when your team receives alerts about anomalies.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {[
          { label: "Email Alerts", description: "Send daily summaries and critical alerts via email.", defaultChecked: true },
          { label: "Slack Integration", description: "Post critical friction alerts to #product-growth channel.", defaultChecked: true },
          { label: "Weekly Conversion Report", description: "Automated performance report sent every Monday.", defaultChecked: false },
          { label: "Real-time API Failure Alerts", description: "Immediate paging when /verify endpoints exceed threshold.", defaultChecked: true },
          { label: "New Insight Digest", description: "Daily summary of top AI-classified drop-off insights.", defaultChecked: false },
        ].map((item, i) => (
          <div key={i}>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{item.label}</Label>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <Switch defaultChecked={item.defaultChecked} />
            </div>
            {i < 4 && <Separator className="mt-6" />}
          </div>
        ))}
      </CardContent>
      <CardFooter className="border-t bg-muted/50 p-6 flex justify-end">
        <Button className="gap-2"><Save className="size-4" /> Save Rules</Button>
      </CardFooter>
    </Card>
  );
}

function SecuritySection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>Use these keys to send events from your signup flow to the dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: "Public API Key", value: "pk_live_kjjbrqgq_•••••••••••••" },
            { label: "Secret API Key", value: "sk_live_•••••••••••••••••••••" },
          ].map((key) => (
            <div key={key.label} className="grid gap-2">
              <Label>{key.label}</Label>
              <div className="flex gap-2">
                <Input value={key.value} readOnly className="font-mono text-sm" />
                <Button variant="outline" size="sm">Copy</Button>
                <Button variant="outline" size="sm" className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground">Revoke</Button>
              </div>
            </div>
          ))}
        </CardContent>
        <CardFooter className="border-t bg-muted/50 p-6">
          <Button variant="outline">Generate New Key</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
          <CardDescription>Enhance security of your dashboard access.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">Require 2FA for all team members.</p>
            </div>
            <Switch />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>IP Allowlist</Label>
              <p className="text-sm text-muted-foreground">Restrict dashboard access to specific IP ranges.</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function IntegrationsSection() {
  const integrations = [
    { name: "Segment", description: "Pipe events from Segment to this dashboard automatically.", connected: true, logo: "S" },
    { name: "Mixpanel", description: "Sync funnel events to Mixpanel for cross-platform analysis.", connected: false, logo: "M" },
    { name: "Amplitude", description: "Forward conversion events to Amplitude.", connected: false, logo: "A" },
    { name: "Intercom", description: "Trigger Intercom messages for users who drop off on Step 3.", connected: true, logo: "I" },
  ];
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>SDK Setup</CardTitle>
          <CardDescription>Instrument your signup flow in under 5 minutes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Add this snippet to your signup form to start tracking events:</p>
          <pre className="rounded-lg bg-muted p-4 text-sm font-mono overflow-x-auto">
{`POST /api/events
{
  "type": "page_view",
  "stepId": "step-1",
  "sessionId": "user_session_id",
  "timestamp": "${new Date().toISOString()}"
}`}
          </pre>
          <Button variant="outline">View Full SDK Docs</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connected Integrations</CardTitle>
          <CardDescription>Manage third-party connections to your analytics stack.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {integrations.map((int) => (
            <div key={int.name} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-md bg-primary/10 text-primary font-bold flex items-center justify-center">
                  {int.logo}
                </div>
                <div>
                  <p className="font-medium text-sm">{int.name}</p>
                  <p className="text-xs text-muted-foreground">{int.description}</p>
                </div>
              </div>
              <Button variant={int.connected ? "outline" : "default"} size="sm" className={int.connected ? "text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground" : ""}>
                {int.connected ? "Disconnect" : "Connect"}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  const [active, setActive] = useState("general");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Configure funnel monitoring, alert thresholds, and system integrations.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Sidebar Nav */}
        <div className="flex flex-col gap-1 lg:col-span-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                active === item.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className="size-4" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Content Panel */}
        <div className="lg:col-span-2">
          {active === "general"       && <GeneralSection />}
          {active === "funnel"        && <FunnelSection />}
          {active === "notifications" && <NotificationSection />}
          {active === "security"      && <SecuritySection />}
          {active === "integrations"  && <IntegrationsSection />}
        </div>
      </div>
    </div>
  );
}
