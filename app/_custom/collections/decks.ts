import type { CollectionConfig } from "payload/types";

import { isStaff } from "../../db/collections/users/users.access";

export const Decks: CollectionConfig = {
   slug: "decks",
   labels: { singular: "Deck", plural: "Decks" },
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
         name: "name",
         type: "text",
      },
      {
         name: "slug",
         type: "text",
      },
      {
         name: "cost",
         type: "select",
         options: ["low", "medium", "high"],
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
         name: "deckTypes",
         type: "relationship",
         relationTo: "types",
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
               max: 2,
            },
         ],
      },
   ],
};
