import type { CollectionConfig } from "payload/types";

import { isStaff } from "../../db/collections/users/users.access";

export const PackCards: CollectionConfig = {
   slug: "pack-cards",
   labels: { singular: "Pack Card", plural: "Pack Cards" },
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
         name: "card",
         type: "relationship",
         relationTo: "cards",
      },
      {
         name: "pack",
         type: "relationship",
         relationTo: "packs",
      },
      {
         name: "pool",
         type: "select",
         options: [
            { label: "Normal", value: "normal" },
            { label: "Rare", value: "rare" },
         ],
      },
      {
         name: "slot",
         type: "select",
         options: [
            { label: "1st - 5th slot", value: "12345" },
            { label: "1st - 3rd slot", value: "123" },
            { label: "4th slot", value: "4" },
            { label: "5th slot", value: "5" },
         ],
      },
      {
         name: "percent",
         type: "number",
      },
      {
         name: "checksum",
         type: "text",
         required: true,
      },
   ],
};
