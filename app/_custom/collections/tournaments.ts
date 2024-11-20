import type { CollectionConfig } from "payload/types";

import { isStaff } from "../../db/collections/users/users.access";

export const Tournaments: CollectionConfig = {
   slug: "tournaments",
   labels: { singular: "Tournament", plural: "Tournaments" },
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
         name: "limitlessId",
         type: "text",
         unique: true,
      },
   ],
};
