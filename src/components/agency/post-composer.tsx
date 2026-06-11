"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { createPostAction, updatePostAction } from "@/lib/actions/posts";
import type { FormState } from "@/lib/actions/clients";
import { Dialog, DialogContent, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { toast } from "@/components/ui/toast";
import { PLATFORM_LABEL } from "@/lib/labels";
import type { SocialPostRow } from "@/types/database";

const INITIAL: FormState = { error: null };

interface Option {
  id: string;
  name: string;
}

/** Compositor com preview ao vivo do feed (caption + mídia).
    Sem `post`: botão "Compor post". Com `post`: modo edição controlado. */
export function PostComposer({
  clients,
  post,
  open: controlledOpen,
  onOpenChange,
}: {
  clients: Option[];
  post?: SocialPostRow;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  const action = post ? updatePostAction : createPostAction;
  const [state, formAction, pending] = useActionState(action, INITIAL);

  const [caption, setCaption] = useState(post?.caption ?? "");
  const [mediaUrl, setMediaUrl] = useState(post?.media_url ?? "");
  const [mediaType, setMediaType] = useState(post?.media_type ?? "");
  const [clientId, setClientId] = useState(post?.client_id ?? "");

  useEffect(() => {
    if (state.ok) {
      toast.success(post ? "Post atualizado." : "Post salvo.");
      setOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const clientName = clients.find((c) => c.id === clientId)?.name ?? "Sua marca";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {controlledOpen === undefined ? (
        <DialogTrigger render={<Button variant="primary" size="sm" />}>
          <Plus /> Compor post
        </DialogTrigger>
      ) : null}
      <DialogContent title={post ? "Editar post" : "Compor post"} className="max-w-3xl">
        <form action={formAction} className="grid gap-5 md:grid-cols-[1fr_240px]">
          {post ? <input type="hidden" name="id" value={post.id} /> : null}
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pc-client">Cliente</Label>
                <NativeSelect id="pc-client" name="client_id" required value={clientId} onChange={(e) => setClientId(e.target.value)}>
                  <option value="" disabled>
                    Selecione
                  </option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pc-platform">Plataforma</Label>
                <NativeSelect id="pc-platform" name="platform" defaultValue={post?.platform ?? "instagram"}>
                  {Object.entries(PLATFORM_LABEL)
                    .filter(([v]) => ["instagram", "facebook", "tiktok"].includes(v))
                    .map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                </NativeSelect>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pc-caption">Caption</Label>
              <Textarea
                id="pc-caption"
                name="caption"
                rows={5}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Texto da publicação… hashtags, CTA, link na bio."
              />
              <span className="num self-end text-[10px] text-ink-faint">{caption.length}/3000</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pc-media">URL da mídia</Label>
                <Input id="pc-media" name="media_url" type="url" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://…" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pc-mediatype">Tipo de mídia</Label>
                <NativeSelect id="pc-mediatype" name="media_type" value={mediaType} onChange={(e) => setMediaType(e.target.value)}>
                  <option value="">Sem mídia</option>
                  <option value="image">Imagem</option>
                  <option value="video">Vídeo</option>
                </NativeSelect>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pc-when">Publicar em</Label>
                <Input
                  id="pc-when"
                  name="scheduled_at"
                  type="datetime-local"
                  defaultValue={post?.scheduled_at ? post.scheduled_at.slice(0, 16) : ""}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pc-status">Status</Label>
                <NativeSelect id="pc-status" name="status" defaultValue={post?.status ?? "draft"}>
                  <option value="draft">Rascunho</option>
                  <option value="scheduled">Agendado</option>
                </NativeSelect>
              </div>
            </div>

            {state.error ? (
              <p role="alert" className="rounded-md border border-loss/30 bg-loss/10 px-3 py-2 text-xs text-loss">
                {state.error}
              </p>
            ) : null}
          </div>

          {/* preview do feed */}
          <aside aria-label="Preview da publicação" className="flex flex-col gap-2">
            <p className="microlabel">Preview</p>
            <div className="overflow-hidden rounded-lg border border-line bg-surface-1">
              <div className="flex items-center gap-2 px-2.5 py-2">
                <Avatar name={clientName} className="size-6 text-[9px]" />
                <span className="truncate text-[11px] font-medium text-ink">{clientName}</span>
              </div>
              <div className="flex aspect-square items-center justify-center bg-surface-0">
                {mediaUrl && mediaType === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaUrl} alt="" className="size-full object-cover" />
                ) : mediaUrl && mediaType === "video" ? (
                  <video src={mediaUrl} className="size-full object-cover" muted playsInline />
                ) : (
                  <span className="text-[10px] text-ink-faint">sem mídia</span>
                )}
              </div>
              <p className="line-clamp-4 whitespace-pre-wrap px-2.5 py-2 text-[11px] leading-relaxed text-ink-mute">
                {caption || "A caption aparece aqui…"}
              </p>
            </div>
          </aside>

          <DialogFooter className="md:col-span-2">
            <Button variant="primary" type="submit" disabled={pending}>
              {pending ? "Salvando…" : post ? "Salvar" : "Salvar post →"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
