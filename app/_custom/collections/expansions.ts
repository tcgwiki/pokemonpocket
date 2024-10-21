import type { CollectionConfig } from "payload/types";

import { isStaff } from "../../db/collections/users/users.access";

export const Expansions: CollectionConfig = {
   slug: "expansions",
   labels: { singular: "Expansion", plural: "Expansions" },
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
         name: "releaseDate",
         type: "date",
      },
      {
         name: "name",
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
         name: "logo",
         type: "upload",
         relationTo: "images",
      },
      {
         name: "isPromo",
         type: "checkbox",
      },
      {
         name: "packs",
         type: "relationship",
         relationTo: "packs",
         hasMany: true,
      },
      {
         name: "cards",
         type: "relationship",
         relationTo: "cards",
         hasMany: true,
         admin: {
            isSortable: true,
         },
      },
      {
         name: "cardCount",
         type: "text",
      },
      {
         name: "checksum",
         type: "text",
         required: true,
      },
   ],
};
