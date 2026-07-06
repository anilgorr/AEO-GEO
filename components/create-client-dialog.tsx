"use client";

import { useRef, useState } from "react";
import { createClientRecord } from "@/app/(dashboard)/tasks-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const PLATFORMS = [
  { value: "google_aio", label: "Google AI Overviews" },
  { value: "chatgpt", label: "ChatGPT" },
  { value: "perplexity", label: "Perplexity" },
  { value: "claude", label: "Claude" },
];

export function CreateClientDialog() {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="outline" className="rounded-full" />}
      >
        Add client
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Client onboarding</DialogTitle>
        </DialogHeader>
        <form
          ref={formRef}
          action={async (formData) => {
            await createClientRecord(formData);
            formRef.current?.reset();
            setOpen(false);
          }}
          className="space-y-4"
        >
          <Tabs defaultValue="basics">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basics">Basics</TabsTrigger>
              <TabsTrigger value="goals">Goals</TabsTrigger>
              <TabsTrigger value="feasibility">Feasibility</TabsTrigger>
            </TabsList>

            <TabsContent value="basics" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Client name</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website_url">Website URL</Label>
                <Input id="website_url" name="website_url" type="url" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input id="industry" name="industry" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="geography">Geography</Label>
                <Select name="geography" defaultValue="national">
                  <SelectTrigger id="geography">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Local</SelectItem>
                    <SelectItem value="national">National</SelectItem>
                    <SelectItem value="global">Global</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="goals" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="primary_goal">Primary goal</Label>
                <Select name="primary_goal" defaultValue="ai_visibility">
                  <SelectTrigger id="primary_goal">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="traffic">Organic traffic</SelectItem>
                    <SelectItem value="leads">Leads</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="ai_visibility">
                      AI answer visibility
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority AI platforms</Label>
                <div className="grid grid-cols-2 gap-2">
                  {PLATFORMS.map((p) => (
                    <label
                      key={p.value}
                      className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        name="platform_priority"
                        value={p.value}
                        defaultChecked={p.value === "google_aio"}
                        className="size-4 accent-primary"
                      />
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="competitors">Top competitors</Label>
                <Textarea
                  id="competitors"
                  name="competitors"
                  rows={2}
                  placeholder="Comma-separated competitor names or URLs"
                />
              </div>
            </TabsContent>

            <TabsContent value="feasibility" className="space-y-4 pt-4">
              <p className="text-xs text-muted-foreground">
                Used to decide which off-page tasks (e.g. Wikipedia) are
                realistic for this client vs. should be skipped.
              </p>
              <label className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  name="has_press_coverage"
                  value="true"
                  className="size-4 accent-primary"
                />
                Has existing press coverage or third-party mentions
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  name="has_smes_for_eeat"
                  value="true"
                  className="size-4 accent-primary"
                />
                Has subject-matter experts available for author bios / E-E-A-T
              </label>
              <div className="space-y-2">
                <Label htmlFor="notes">Other notes</Label>
                <Textarea id="notes" name="notes" rows={3} />
              </div>
            </TabsContent>
          </Tabs>

          <Button type="submit" className="w-full">
            Add client
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
