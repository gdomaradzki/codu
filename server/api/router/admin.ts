import { TRPCError } from "@trpc/server";
import { BanUserSchema, UnbanUserSchema } from "../../../schema/admin";

import { createTRPCRouter, adminOnlyProcedure } from "../trpc";

export const adminRouter = createTRPCRouter({
  ban: adminOnlyProcedure
    .input(BanUserSchema)
    .mutation(async ({ input, ctx }) => {
      const { userId, note } = input;
      const currentUserId = ctx.session.user.id;

      const user = await ctx.db.user.findFirstOrThrow({
        where: {
          id: userId,
        },
      });

      if (user.role === "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
        });
      }

      await ctx.db.bannedUsers.create({
        data: {
          userId,
          note,
          bannedById: currentUserId,
        },
      });
      await ctx.db.session.deleteMany({
        where: {
          userId,
        },
      });

      return { banned: true };
    }),
  unban: adminOnlyProcedure
    .input(UnbanUserSchema)
    .mutation(async ({ input, ctx }) => {
      const { userId } = input;

      await ctx.db.bannedUsers.deleteMany({
        where: {
          userId,
        },
      });

      return { unbanned: true };
    }),
});
