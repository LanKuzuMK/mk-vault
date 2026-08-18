/* Public visitor catalog and administrator-only publication helpers. */
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { publicProjects } from "../drizzle/schema";
import { getDb } from "./db";

export const publicProjectInputSchema = z.object({
  id: z.string().min(1).max(128),
  url: z.string().url().max(2_048),
  title: z.string().min(1).max(80),
  category: z.enum(["Game", "Tool", "App", "Portfolio", "Other"]),
  note: z.string().max(160),
});

export const publicProjectIdSchema = z.object({ id: z.string().min(1).max(128) });
export const featuredProjectInputSchema = publicProjectIdSchema.extend({ featuredRank: z.number().int().min(0).max(999) });

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("The project catalog database is unavailable.");
  return db;
}

export async function listPublishedProjects() {
  const db = await requireDb();
  return db
    .select({
      id: publicProjects.id,
      url: publicProjects.url,
      title: publicProjects.title,
      category: publicProjects.category,
      note: publicProjects.note,
      featuredRank: publicProjects.featuredRank,
    })
    .from(publicProjects)
    .where(eq(publicProjects.isPublished, true))
    .orderBy(desc(publicProjects.featuredRank), desc(publicProjects.updatedAt));
}

export async function listAdministratorProjects(ownerId: number) {
  const db = await requireDb();
  return db
    .select()
    .from(publicProjects)
    .where(eq(publicProjects.ownerId, ownerId))
    .orderBy(desc(publicProjects.featuredRank), desc(publicProjects.updatedAt));
}

export async function publishProject(ownerId: number, input: z.infer<typeof publicProjectInputSchema>) {
  const db = await requireDb();
  await db
    .insert(publicProjects)
    .values({ ...input, ownerId, isPublished: true })
    .onDuplicateKeyUpdate({
      set: { url: input.url, title: input.title, category: input.category, note: input.note, isPublished: true },
    });
  return { id: input.id, published: true };
}

export async function removePublishedProject(ownerId: number, id: string) {
  const db = await requireDb();
  await db.delete(publicProjects).where(and(eq(publicProjects.ownerId, ownerId), eq(publicProjects.id, id)));
  return { id, published: false };
}

export async function setFeaturedProjectRank(ownerId: number, input: z.infer<typeof featuredProjectInputSchema>) {
  const db = await requireDb();
  await db.transaction(async (tx) => {
    if (input.featuredRank > 0) {
      await tx
        .update(publicProjects)
        .set({ featuredRank: 0 })
        .where(and(eq(publicProjects.ownerId, ownerId), eq(publicProjects.featuredRank, input.featuredRank)));
    }

    await tx
      .update(publicProjects)
      .set({ featuredRank: input.featuredRank })
      .where(and(eq(publicProjects.ownerId, ownerId), eq(publicProjects.id, input.id), eq(publicProjects.isPublished, true)));
  });
  return { id: input.id, featuredRank: input.featuredRank };
}
