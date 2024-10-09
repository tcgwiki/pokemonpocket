import type { CollectionConfig } from "payload/types";

import { isStaff } from "../../db/collections/users/users.access";

export const CardMain: CollectionConfig = {
   slug: "card-main",
   labels: { singular: "Card Collection", plural: "Card Collections" },
   admin: {
      group: "Custom",
      useAsTitle: "name",
   },
   access: {
      create: isStaff,
      read: () => true,
      update: isStaff,
      delete: isStaff,
   },
   fields: [
      {
         name: "id",
         type: "text",
      },
      {
         name: "name",
         type: "text",
      },
      {
         name: "simpleName",
         type: "text",
      },
      {
         name: "slug",
         type: "text",
      },
      {
         name: "icon",
         type: "upload",
         relationTo: "images",
      },
      {
         name: "set",
         type: "relationship",
         relationTo: "sets",
         hasMany: false,
      },
      {
         name: "cards",
         type: "relationship",
         relationTo: "cards",
         hasMany: true,
      },
   ],
};
