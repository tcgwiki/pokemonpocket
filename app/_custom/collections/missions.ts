import type { CollectionConfig } from "payload/types";
import { isStaff } from "../../db/collections/users/users.access";

export const Missions: CollectionConfig = {
   slug: "missions",
   labels: { singular: "Mission", plural: "Missions" },
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
         name: "category",
         type: "select",
         options: [
            { label: "Daily", value: "daily" },
            { label: "Card Dex", value: "card_dex" },
            { label: "Deck", value: "deck" },
            { label: "Event", value: "event" },
            { label: "Premium", value: "premium" },
            { label: "Themed Collection", value: "themed_collection" },
            { label: "Tutorial", value: "tutorial" },
         ],
      },
      {
         name: "permanent",
         type: "checkbox",
      },
      {
         name: "expansion",
         type: "relationship",
         relationTo: "expansions",
      },
      {
         name: "startTime",
         type: "number",
         admin: {
            condition: (_, siblingData) => !siblingData.permanent,
         }
      },
      {
         name: "endTime",
         type: "number",
         admin: {
            condition: (_, siblingData) => !siblingData.permanent,
         }
      },
      {
         name: "progressRewards",
         type: "array",
         fields: [
            {
               name: "count",
               type: "number",
            },
            {
               name: "item",
               type: "relationship",
               relationTo: ["cards", "customizations", "items", "rental-decks",],
            },
            {
               name: "amount",
               type: "number",
            }
         ]
      },
      {
         name: "missions",
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
               name: "needed",
               type: "number",
            },
            {
               name: "rewards",
               type: "array",
               fields: [
                  {
                     name: "item",
                     type: "relationship",
                     relationTo: ["cards", "customizations", "items", "rental-decks",],
                  },
                  {
                     name: "amount",
                     type: "number",
                  },
               ],
            },
            {
               name: "targets",
               type: "relationship",
               relationTo: "cards"
            },
         ],
      },
      {
         name: "checksum",
         type: "text",
         required: true,
      },
   ],
};
