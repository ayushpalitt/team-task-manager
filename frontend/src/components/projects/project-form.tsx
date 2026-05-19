"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User } from "@/types";

const schema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(1000).optional(),
  memberIds: z.array(z.string()).optional()
});

export type ProjectFormValues = z.infer<typeof schema>;

export function ProjectForm({
  defaultValues,
  availableMembers,
  onSubmit,
  submitLabel
}: {
  defaultValues?: Partial<ProjectFormValues>;
  availableMembers?: User[];
  onSubmit: (values: ProjectFormValues) => Promise<void>;
  submitLabel: string;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title || "",
      description: defaultValues?.description || "",
      memberIds: defaultValues?.memberIds || []
    }
  });
  const selectedMemberIds = watch("memberIds") || [];

  const toggleMember = (memberId: string) => {
    setValue(
      "memberIds",
      selectedMemberIds.includes(memberId)
        ? selectedMemberIds.filter((id) => id !== memberId)
        : [...selectedMemberIds, memberId],
      { shouldDirty: true, shouldValidate: true }
    );
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" {...register("title")} />
        {errors.title ? <p className="text-xs text-destructive">{errors.title.message}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...register("description")} />
      </div>
      {availableMembers?.length ? (
        <div className="space-y-2">
          <Label>Assign members</Label>
          <div className="max-h-52 space-y-2 overflow-y-auto rounded-md border p-2">
            {availableMembers.map((member) => {
              const checked = selectedMemberIds.includes(member._id);
              return (
                <label key={member._id} className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-secondary">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{member.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{member.email}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {member.activeTaskCount ? <Badge variant="secondary">{member.activeTaskCount} active</Badge> : null}
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={checked}
                      onChange={() => toggleMember(member._id)}
                    />
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ) : null}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
