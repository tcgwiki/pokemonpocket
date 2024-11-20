import type { CollectionConfig } from "payload/types";

import { isStaff } from "../../db/collections/users/users.access";

export const TournamentUsers: CollectionConfig = {
   slug: "tournament-users",
   labels: { singular: "Tournament User", plural: "Tournament Users" },
   admin: {
      group: "Custom",
      useAsTitle: "name",
   },
   access: {
      create: isStaff,
      read: isStaff,
      update: isStaff,
      delete: isStaff,
   },
   fields: [
      {
         name: "name",
         type: "text",
      },
      {
         name: "siteUserId",
         type: "text",
         unique: true,
      },
      {
         name: "country",
         type: "text",
      },
      {
         name: "limitlessUserId",
         type: "text",
         unique: true,
      },
   ],
};
