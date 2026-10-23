import type { MouseEvent } from "react";
import { Video, Phone, Mail, ExternalLink, MessageCircle, MapPin } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Meeting, Platform } from "@/lib/meetings/types";
import { buildJoinUrl, canAutoJoin, joinLabel } from "@/lib/meetings/platforms";
import { copyText, copyTextNow } from "@/lib/meetings/zoom";

type Props = {
  meeting: Meeting;
  size?: "sm" | "lg";
  className?: string;
  stopPropagation?: boolean;
};

export function JoinButton({ meeting, size = "sm", className, stopPropagation = true }: Props) {
  const href = buildJoinUrl(meeting);
  const label = buttonLabel(meeting, size);
  const Icon = iconFor(meeting.platform);

  async function onClick(e: MouseEvent<HTMLAnchorElement>) {
    if (stopPropagation) e.stopPropagation();
    if (!href) {
      e.preventDefault();
      toast("Add a room or link first");
      return;
    }
    if (!meeting.password) return;
    // Copy before leaving the page. Android drops an async clipboard write
    // once Zoom takes the screen, so the passcode never reaches the prompt.
    e.preventDefault();
    let copied = copyTextNow(meeting.password);
    if (!copied) copied = await copyText(meeting.password);
    toast(copied ? "Passcode copied — paste it if the room asks" : "Opening the room");
    window.location.assign(href);
  }

  if (!href) {
    return (
      <span
        className={cn(
          "btn-secondary opacity-50",
          size === "lg" ? "h-12 px-5 text-base" : "h-10 min-w-16 px-3 text-sm",
          className,
        )}
      >
        —
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "btn-primary",
        size === "lg" ? "h-12 px-5 text-lg" : "h-10 min-w-16 px-3 text-sm",
        className,
      )}
    >
      <Icon className={size === "lg" ? "size-5" : "size-4"} strokeWidth={2.2} />
      <span className="whitespace-nowrap">{label}</span>
      {size === "lg" ? <ExternalLink className="size-4 opacity-80" /> : null}
    </a>
  );
}

function iconFor(platform: Platform) {
  if (platform === "phone") return Phone;
  if (platform === "email") return Mail;
  if (platform === "inperson") return MapPin;
  if (platform === "telegram" || platform === "whatsapp" || platform === "signal" || platform === "discord") {
    return MessageCircle;
  }
  if (platform === "other") return ExternalLink;
  return Video;
}

function buttonLabel(meeting: Meeting, size: "sm" | "lg") {
  if (meeting.platform === "inperson") return "Go";
  if (canAutoJoin(meeting)) return "Auto-Join";
  if (meeting.platform === "zoom" || meeting.platform === "jitsi" || meeting.platform === "meet" || meeting.platform === "teams" || meeting.platform === "skype") {
    return "Join";
  }
  return size === "lg" ? joinLabel(meeting.platform) : shortLabel(meeting.platform);
}

function shortLabel(platform: Platform) {
  if (platform === "inperson") return "Go";
  if (platform === "zoom" || platform === "jitsi" || platform === "meet") return "Join";
  return joinLabel(platform);
}
