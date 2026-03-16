import { useState } from "react";
import { useNavigate } from "react-router";

import { usePickFolder, useRegisterProject } from "../hooks/use-projects.js";
import { Button } from "./ui/button.js";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "./ui/dialog.js";

export function NewProjectDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const registerMutation = useRegisterProject();
  const pickFolder = usePickFolder();
  const [rootPath, setRootPath] = useState("");
  const [name, setName] = useState("");

  const handleClose = () => {
    setRootPath("");
    setName("");
    registerMutation.reset();
    onOpenChange(false);
  };

  const handleBrowse = async () => {
    const result = await pickFolder.mutateAsync();
    if (result.path) {
      setRootPath(result.path);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const response = await registerMutation.mutateAsync({
      rootPath,
      name: name || undefined
    });
    handleClose();
    navigate(`/projects/${response.project.slug}/board`);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) handleClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Project</DialogTitle>
          <DialogDescription>
            Register a repository path to start tracking its workflow.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form onSubmit={handleSubmit}>
            <label className="block font-body text-sm text-muted-foreground">
              Project path
              <div className="mt-1 flex gap-2">
                <input
                  value={rootPath}
                  onChange={(event) => setRootPath(event.target.value)}
                  placeholder="/path/to/project"
                  className="min-w-0 flex-1 border border-input bg-card px-2 py-1.5 font-mono text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={handleBrowse}
                  disabled={pickFolder.isPending}
                >
                  {pickFolder.isPending ? "..." : "Browse"}
                </Button>
              </div>
            </label>

            <label className="mt-4 block font-body text-sm text-muted-foreground">
              Display name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Optional"
                className="mt-1 w-full border border-input bg-card px-2 py-1.5 font-mono text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </label>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={!rootPath || registerMutation.isPending}
              className="mt-6 w-full"
            >
              {registerMutation.isPending ? "Registering..." : "Register Project"}
            </Button>

            {registerMutation.isError && (
              <p className="mt-3 font-mono text-xs text-destructive">
                Registration failed. Check the path and try again.
              </p>
            )}
          </form>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
