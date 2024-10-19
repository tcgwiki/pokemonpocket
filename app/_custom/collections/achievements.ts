import type { CollectionConfig } from "payload/types";

import { isStaff } from "../../db/collections/users/users.access";

export const Achievements: CollectionConfig = {
   slug: "achievements",
   labels: { singular: "Achievement", plural: "Achievements" },
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
         name: "desc",
         type: "text",
      },
      {
         name: "ranks",
         type: "array",
         fields: [
            {
               name: "name",
               type: "select",
               options: [
                  { label: "Unspecified", value: "TROPHY_RANK_UNSPECIFIED" },
                  { label: "Bronze", value: "TROPHY_RANK_BRONZE" },
                  { label: "Silver", value: "TROPHY_RANK_SLIVER" },
                  { label: "Gold", value: "TROPHY_RANK_GOLD" },
                  { label: "Platinum", value: "TROPHY_RANK_RAINBOW" },
               ],
            },
            {
               name: "amount",
               type: "number",
            },
            {
               name: "rewards",
               type: "array",
               fields: [
                  {
                     "name": "item",
                     "type": "relationship",
                     "relationTo": "items",
                  },
                  {
                     "name": "amount",
                     "type": "number",
                  }
               ]
            }
         ],
      },
      {
         name: "category",
         type: "select",
         options: [
            { label: "Unspecified", value: "TROPHY_CATEGORY_UNSPECIFIED" },
            { label: "Activity", value: "TROPHY_CATEGORY_ACTIVITY" },
            { label: "Collection", value: "TROPHY_CATEGORY_COLLECTION" },
            { label: "Battle", value: "TROPHY_CATEGORY_BATTLE" },
         ],
      },
      {
         name: "checksum",
         type: "text",
         required: true,
      },
   ],
};
