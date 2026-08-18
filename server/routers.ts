import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { featuredProjectInputSchema, listAdministratorProjects, listPublishedProjects, publicProjectIdSchema, publicProjectInputSchema, publishProject, removePublishedProject, setFeaturedProjectRank } from "./catalog";
import { getRemoteVaultStatus, restoreRemoteVault, saveRemoteVault, vaultBackupInputSchema } from "./r2Vault";

export const appRouter = router({
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  vaultBackup: router({
    status: adminProcedure.query(({ ctx }) => getRemoteVaultStatus(ctx.user.id)),
    save: adminProcedure.input(vaultBackupInputSchema).mutation(({ ctx, input }) => saveRemoteVault(ctx.user.id, input)),
    restore: adminProcedure.query(({ ctx }) => restoreRemoteVault(ctx.user.id)),
  }),

  publicCatalog: router({
    list: publicProcedure.query(() => listPublishedProjects()),
  }),

  adminCatalog: router({
    list: adminProcedure.query(({ ctx }) => listAdministratorProjects(ctx.user.id)),
    publish: adminProcedure.input(publicProjectInputSchema).mutation(({ ctx, input }) => publishProject(ctx.user.id, input)),
    unpublish: adminProcedure.input(publicProjectIdSchema).mutation(({ ctx, input }) => removePublishedProject(ctx.user.id, input.id)),
    setFeaturedRank: adminProcedure.input(featuredProjectInputSchema).mutation(({ ctx, input }) => setFeaturedProjectRank(ctx.user.id, input)),
  }),

});

export type AppRouter = typeof appRouter;
