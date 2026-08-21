"use client";

import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function StudyPicker({
  studies,
  selectedStudyId,
}: {
  studies: { id: string; label: string }[];
  selectedStudyId: string;
}) {
  const router = useRouter();

  return (
    <Select
      // Base UI's <Select.Value> only resolves the trigger's displayed
      // label from this `items` list — without it, it falls back to
      // showing the raw `value` (here, the study's uuid) until the popup
      // has been opened once and the matching <Select.Item> has mounted.
      // See @base-ui/react/select's SelectRootProps.items.
      items={studies.map((study) => ({ value: study.id, label: study.label }))}
      value={selectedStudyId}
      onValueChange={(id) => id && router.push(`/dashboard/team?study=${id}`)}
    >
      <SelectTrigger className="w-full sm:w-64">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {studies.map((study) => (
          <SelectItem key={study.id} value={study.id}>
            {study.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
