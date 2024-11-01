import type { CollectionConfig } from "payload/types";

import { isStaff } from "../../db/collections/users/users.access";

export const SoloBattles: CollectionConfig = {
   slug: "solo-battles",
   labels: { singular: "Solo Battle", plural: "Solo Battles" },
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
         name: "slug",
         type: "text",
      },
      {
         name: "name",
         type: "text",
      },
      {
         name: "isEvent",
         type: "checkbox",
      },
      {
         name: "stepupGroup",
         type: "select",
         admin: {
            condition: (_, siblingData) => !siblingData.isEvent,
         },
         options: [
            { label: "Beginner", value: "beginner" },
            { label: "Intermediate", value: "intermediate" },
            { label: "Advanced", value: "advanced" },
            { label: "Expert", value: "expert" },
         ],
      },
      {
         name: "startDate",
         type: "number",
         admin: {
            condition: (_, siblingData) => siblingData.isEvent,
         }
      },
      {
         name: "endDate",
         type: "number",
         admin: {
            condition: (_, siblingData) => siblingData.isEvent,
         }
      },
      {
         name: "energyRequired",
         type: "number",
         admin: {
            condition: (_, siblingData) => siblingData.isEvent,
         }
      },
      {
         name: "expansion",
         type: "relationship",
         relationTo: "expansions",
      },
      {
         name: "clearRewards",
         type: "array",
         fields: [
            {
               name: "item",
               type: "relationship",
               relationTo: "items",
            },
            {
               name: "amount",
               type: "number",
            },
         ],
      },
      {
         name: "drops",
         type: "array",
         fields: [
            {
               name: "item",
               type: "relationship",
               relationTo: "items",
            },
            {
               name: "amount",
               type: "number",
            },
            {
               name: "chance",
               type: "number",
            },
         ],
      }
      {
         name: "tasks",
         type: "array",
         fields: [
            {
               name: "id",
               type: "text",
            },
            {
               name: "text",
               type: "text",
            },
            {
               name: "rewards",
               type: "array",
               fields: [
                  {
                     name: "id",
                     type: "text",
                  },
                  {
                     name: "item",
                     type: "relationship",
                     relationTo: "items",
                  },
                  {
                     name: "amount",
                     type: "number",
                  },
               ],
            }
         ],
      },
      {
         name: "energyType",
         type: "relationship",
         relationTo: "types",
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
   ],
};
