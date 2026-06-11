"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal } from "lucide-react";
import { deletePostAction, markPostPublishedAction } from "@/lib/actions/posts";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { PostComposer } from "./post-composer";
import { toast } from "@/components/ui/toast";
import type { SocialPostRow } from "@/types/database";

interface Option {
  id: string;
  name: string;
}

export function PostRowActions({ post, clients }: { post: SocialPostRow; clients: Option[] }) {
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);

  function run(action: (fd: FormData) => Promise<void>, message: string) {
    const fd = new FormData();
    fd.set("id", post.id);
    startTransition(async () => {
      await action(fd);
      toast.success(message);
    });
  }

  return (
    <>
      <Menu>
        <MenuTrigger
          aria-label="Ações do post"
          className="rounded-sm p-1 text-ink-faint transition-colors hover:bg-surface-3 hover:text-ink"
        >
          <MoreHorizontal className="size-4" />
        </MenuTrigger>
        <MenuContent>
          <MenuItem onClick={() => setEditing(true)}>Editar</MenuItem>
          {post.status !== "published" ? (
            <MenuItem onClick={() => run(markPostPublishedAction, "Post marcado como publicado.")}>
              Marcar como publicado
            </MenuItem>
          ) : null}
          <MenuSeparator />
          <MenuItem
            danger
            onClick={() => {
              if (window.confirm("Excluir este post?")) run(deletePostAction, "Post excluído.");
            }}
          >
            Excluir
          </MenuItem>
        </MenuContent>
      </Menu>

      {editing ? <PostComposer clients={clients} post={post} open={editing} onOpenChange={setEditing} /> : null}
    </>
  );
}
