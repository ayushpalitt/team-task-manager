"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, apiMessage } from "@/lib/api";
import { initials } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useToastStore } from "@/store/toast-store";
import { User } from "@/types";

const schema = z.object({
  name: z.string().min(2).max(80),
  avatarColor: z.string().regex(/^#[0-9a-f]{6}$/i)
});

type Values = z.infer<typeof schema>;

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const toast = useToastStore((state) => state.toast);
  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    values: { name: user?.name || "", avatarColor: user?.avatarColor || "#2563eb" }
  });

  const submit = async (values: Values) => {
    try {
      const { data } = await api.patch<{ user: User }>("/users/profile", values);
      setUser(data.user);
      toast({ title: "Profile updated" });
    } catch (error) {
      toast({ title: "Profile update failed", description: apiMessage(error), variant: "destructive" });
    }
  };

  if (!user) return null;

  return (
    <div>
      <PageHeader title="Profile" description="Manage the identity shown to your teammates." />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Personal details</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(submit)}>
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-full text-lg font-semibold text-white" style={{ backgroundColor: user.avatarColor }}>
                {initials(user.name)}
              </span>
              <div>
                <p className="font-medium">{user.email}</p>
                <p className="text-sm capitalize text-muted-foreground">{user.role}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register("name")} />
              {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatarColor">Avatar color</Label>
              <Input id="avatarColor" type="color" className="h-12 p-1" {...register("avatarColor")} />
            </div>
            <Button disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save profile"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
