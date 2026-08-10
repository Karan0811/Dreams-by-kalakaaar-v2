"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AtSign, Trash2 } from "lucide-react";
import {
  useCreatorSocialLinks,
  useCreateCreatorSocialLink,
  useDeleteCreatorSocialLink,
} from "@dbk/api-client";
import { Button, Card, EmptyState, ErrorState, FormField, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton, toast } from "@dbk/ui";

const PLATFORMS = ["INSTAGRAM", "FACEBOOK", "YOUTUBE", "PINTEREST", "TWITTER", "WEBSITE", "OTHER"] as const;

const socialLinkFormSchema = z.object({
  platform: z.enum(PLATFORMS),
  url: z.string().trim().url("Enter a valid URL"),
});
type SocialLinkFormInput = z.infer<typeof socialLinkFormSchema>;

export function CreatorSocialLinksSection() {
  const { data: links, isLoading, isError, refetch } = useCreatorSocialLinks();
  const createLink = useCreateCreatorSocialLink();
  const deleteLink = useDeleteCreatorSocialLink();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SocialLinkFormInput>({ resolver: zodResolver(socialLinkFormSchema), defaultValues: { platform: "INSTAGRAM" } });

  async function onSubmit(values: SocialLinkFormInput) {
    try {
      await createLink.mutateAsync(values);
      toast.success("Social link saved");
      reset({ platform: "INSTAGRAM", url: "" });
    } catch {
      toast.error("Couldn't save this link. Please try again.");
    }
  }

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (isError) return <ErrorState description="We couldn't load your social links." onRetry={() => refetch()} />;

  return (
    <div className="flex flex-col gap-[var(--space-300)]">
      <h2 className="text-[16px] font-medium text-text-primary">Social Links</h2>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="sm:w-40">
          <FormField id="platform" label="Platform">
            <Select value={watch("platform")} onValueChange={(v) => setValue("platform", v as SocialLinkFormInput["platform"])}>
              <SelectTrigger id="platform">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((platform) => (
                  <SelectItem key={platform} value={platform}>
                    {platform.charAt(0) + platform.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>
        <div className="flex-1">
          <FormField id="url" label="URL" error={errors.url?.message}>
            <Input placeholder="https://..." {...register("url")} />
          </FormField>
        </div>
        <Button type="submit" isLoading={isSubmitting}>
          Save
        </Button>
      </form>

      {!links || links.length === 0 ? (
        <EmptyState icon={AtSign} title="No social links yet" description="Add links to your Instagram, website, or other platforms." />
      ) : (
        <ul className="flex flex-col gap-2">
          {links.map((link) => (
            <li key={link.id}>
              <Card className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-medium text-text-primary">
                    {link.platform.charAt(0) + link.platform.slice(1).toLowerCase()}
                  </p>
                  <a href={link.url} target="_blank" rel="noreferrer" className="text-[13px] text-text-link hover:underline">
                    {link.url}
                  </a>
                </div>
                <Button
                  variant="tertiary"
                  size="sm"
                  aria-label="Delete social link"
                  onClick={() =>
                    deleteLink.mutate(link.id, {
                      onSuccess: () => toast.success("Link removed"),
                      onError: () => toast.error("Couldn't remove this link. Please try again."),
                    })
                  }
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
