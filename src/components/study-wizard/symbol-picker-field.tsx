"use client";

import { Controller, useFormContext } from "react-hook-form";
import type { StudyConfiguration } from "@/lib/study-schema";
import { asPath, errorAt } from "./field-primitives";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";
import {
  Moon,
  BedDouble,
  Sun,
  Heart,
  HeartPulse,
  Footprints,
  Droplet,
  Pill,
  Stethoscope,
  Brain,
  Bell,
  TriangleAlert,
  CheckCircle2,
  Clock,
  Calendar,
  Hourglass,
  Camera,
  Image,
  Lock,
  ShieldCheck,
  Activity,
  Battery,
  Thermometer,
  Wind,
  CloudRain,
  Volume2,
  MessageCircle,
  Users,
  Target,
  TrendingUp,
  ClipboardList,
  BookOpen,
  Coffee,
  Utensils,
  Music,
  Smile,
  Star,
  Flag,
  type LucideIcon,
} from "lucide-react";

// SF Symbols can't be rendered in a browser — they're an Apple-platform
// asset, not something embeddable on the web. This is a curated list of
// real SF Symbol names (the value actually stored and sent to the iOS
// app, unchanged) paired with a similar-looking lucide-react icon (already
// a dependency) purely as an on-screen approximation, so researchers can
// browse and click rather than needing to already know a symbol's exact
// name. Ordered loosely by theme (sleep, health, alerts, time, media,
// security, activity, communication, misc) without hard section headers —
// simpler to build correctly than a grouped Select, and 40-ish items reads
// fine as one list.
const SYMBOL_OPTIONS: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "moon.stars", label: "moon.stars — moon & stars", icon: Moon },
  { value: "moon.zzz", label: "moon.zzz — sleeping moon", icon: Moon },
  { value: "bed.double.fill", label: "bed.double.fill — bed", icon: BedDouble },
  { value: "sun.max.fill", label: "sun.max.fill — sun", icon: Sun },
  { value: "heart.fill", label: "heart.fill — heart", icon: Heart },
  { value: "heart.text.square.fill", label: "heart.text.square.fill — heart & notes", icon: HeartPulse },
  { value: "figure.walk", label: "figure.walk — walking figure", icon: Footprints },
  { value: "figure.run", label: "figure.run — running figure", icon: Activity },
  { value: "drop.fill", label: "drop.fill — water drop", icon: Droplet },
  { value: "pills.fill", label: "pills.fill — medication", icon: Pill },
  { value: "stethoscope", label: "stethoscope — stethoscope", icon: Stethoscope },
  { value: "brain.head.profile", label: "brain.head.profile — brain", icon: Brain },
  { value: "bell.fill", label: "bell.fill — bell", icon: Bell },
  { value: "exclamationmark.triangle.fill", label: "exclamationmark.triangle.fill — warning", icon: TriangleAlert },
  { value: "checkmark.circle.fill", label: "checkmark.circle.fill — checkmark", icon: CheckCircle2 },
  { value: "clock.fill", label: "clock.fill — clock", icon: Clock },
  { value: "calendar", label: "calendar — calendar", icon: Calendar },
  { value: "hourglass", label: "hourglass — hourglass", icon: Hourglass },
  { value: "camera.fill", label: "camera.fill — camera", icon: Camera },
  { value: "photo.fill", label: "photo.fill — photo", icon: Image },
  { value: "lock.shield", label: "lock.shield — lock & shield", icon: Lock },
  { value: "checkmark.shield.fill", label: "checkmark.shield.fill — verified shield", icon: ShieldCheck },
  { value: "battery.100", label: "battery.100 — battery", icon: Battery },
  { value: "thermometer", label: "thermometer — thermometer", icon: Thermometer },
  { value: "wind", label: "wind — wind", icon: Wind },
  { value: "cloud.rain.fill", label: "cloud.rain.fill — rain cloud", icon: CloudRain },
  { value: "speaker.wave.2.fill", label: "speaker.wave.2.fill — sound", icon: Volume2 },
  { value: "message.fill", label: "message.fill — message", icon: MessageCircle },
  { value: "person.2.fill", label: "person.2.fill — people", icon: Users },
  { value: "target", label: "target — target", icon: Target },
  { value: "chart.line.uptrend.xyaxis", label: "chart.line.uptrend.xyaxis — trend chart", icon: TrendingUp },
  { value: "list.clipboard.fill", label: "list.clipboard.fill — clipboard", icon: ClipboardList },
  { value: "book.fill", label: "book.fill — book", icon: BookOpen },
  { value: "cup.and.saucer.fill", label: "cup.and.saucer.fill — cup", icon: Coffee },
  { value: "fork.knife", label: "fork.knife — meal", icon: Utensils },
  { value: "music.note", label: "music.note — music", icon: Music },
  { value: "face.smiling", label: "face.smiling — smiling face", icon: Smile },
  { value: "star.fill", label: "star.fill — star", icon: Star },
  { value: "flag.fill", label: "flag.fill — flag", icon: Flag },
];

function OptionContent({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <Icon className="size-4 shrink-0" />
      <span className="font-mono text-xs">{label}</span>
    </span>
  );
}

export function SymbolPickerField({ name, label = "Symbol" }: { name: string; label?: string }) {
  const {
    control,
    formState: { errors },
  } = useFormContext<StudyConfiguration>();
  const error = errorAt(errors, name);

  return (
    <Controller
      control={control}
      name={asPath(name)}
      render={({ field }) => (
        <Field data-invalid={!!error}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <Select
            // See components/ui/select.tsx callers elsewhere — Base UI's
            // <Select.Value> only resolves the trigger's shown label from
            // this `items` list, and this is also where the label's icon
            // (not just plain text) gets attached to what renders in the
            // trigger.
            items={SYMBOL_OPTIONS.map((option) => ({
              value: option.value,
              label: <OptionContent icon={option.icon} label={option.label} />,
            }))}
            value={(field.value as string) || null}
            onValueChange={(value) => value && field.onChange(value)}
          >
            <SelectTrigger id={name} className="w-full">
              <SelectValue placeholder="Choose a symbol" />
            </SelectTrigger>
            <SelectContent>
              {SYMBOL_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <OptionContent icon={option.icon} label={option.label} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldDescription>
            Preview icons approximate the look — exact rendering happens natively on iOS.
          </FieldDescription>
          <FieldError errors={error ? [error] : undefined} />
        </Field>
      )}
    />
  );
}
