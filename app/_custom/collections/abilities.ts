import type { CollectionConfig } from "payload/types";

import { isStaff } from "../../db/collections/users/users.access";

export const Abilities: CollectionConfig = {
   slug: "abilities",
   labels: { singular: "Ability", plural: "Abilities" },
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
         name: "id",
         type: "text",
      },
      {
         name: "slug",
         type: "text",
      },
      {
         name: "name",
         type: "text",
      },
      {
         name: "desc",
         type: "text",
      },
      {
         name: "cards",
         type: "relationship",
         relationTo: "cards",
         hasMany: true,
      },
      {
         name: "checksum",
         type: "text",
         required: true,
      },
      {
         name: "icon",
         type: "upload",
         relationTo: "images",
      },
   ],
};
