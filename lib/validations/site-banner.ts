import { z } from "zod";

export const bannerConfigSchema = z
  .object({
    enabled: z.boolean(),
    message: z.string().max(200, "Message must be 200 characters or fewer"),
    href: z
      .string()
      .max(2000)
      .refine(
        (v) => v === "" || /^https:\/\//i.test(v),
        "Link must start with https://",
      )
      .refine((v) => {
        if (v === "") return true;
        try {
          new URL(v);
          return true;
        } catch {
          return false;
        }
      }, "Invalid URL"),
  })
  .refine((data) => !data.enabled || data.message.length > 0, {
    message: "Enabled banner must have a message",
    path: ["message"],
  });

export type BannerConfigInput = z.infer<typeof bannerConfigSchema>;
