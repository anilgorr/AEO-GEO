"use client";

import { useRef, useState } from "react";
import { createClientRecord } from "@/app/(dashboard)/tasks-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CreateClientDialog() {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" className="rounded-full" />}>
        Add client
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add client</DialogTitle>
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
          <Button type="submit" className="w-full">
            Add client
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
