import type { CollectionConfig } from "payload/types";

import { isStaff } from "../../db/collections/users/users.access";

export const Archetypes: CollectionConfig = {
   slug: "user-decks",
   labels: { singular: "User Deck", plural: "User Decks" },
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
         name: "slug",
         type: "text",
      },
      {
         name: "icon",
         type: "upload",
         relationTo: "images",
      },
      {
         name: "highlightCards",
         type: "relationship",
         relationTo: "card-groups",
         hasMany: true,
      },
      {
         name: "cards",
         type: "array",
         maxRows: 20,
         fields: [
            {
               name: "card",
               type: "relationship",
               relationTo: "cards",
            },
            {
               name: "count",
               type: "number",
            },
         ],
      },
   ],
};