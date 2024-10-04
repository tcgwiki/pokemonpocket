import type { CollectionConfig } from "payload/types";

import { isStaff } from "../../db/collections/users/users.access";

export const Cards: CollectionConfig = {
   slug: "cards",
   labels: { singular: "card", plural: "cards" },
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
         name: "desc",
         type: "text",
      },
      {
         name: "rarity",
         type: "relationship",
         relationTo: "rarities",
      },
      {
         name: "cardType",
         type: "select",
         options: [
            { label: "Pokémon", value: "pokemon" },
            { label: "Trainer", value: "trainer" },
         ],
      },
      // Trainer Cards
      {
         name: "trainerType",
         type: "select",
         options: [
            { label: "Supporter", value: "supporter" },
            { label: "Item", value: "item" },
            { label: "Fossil", value: "fossil" },
         ],
         admin: {
            condition: (_, siblingData) => siblingData.type === "trainer",
         },
      },
      // Pokemon Cards
      {
         name: "hp",
         type: "number",
         admin: {
            condition: (_, siblingData) => siblingData.type === "pokemon",
         },
      },
      {
         name: "pokemonType",
         relationTo: "types",
         type: "relationship",
         admin: {
            condition: (_, siblingData) => siblingData.type === "pokemon",
         },
      },
      {
         name: "weaknessType",
         relationTo: "types",
         type: "relationship",
         admin: {
            condition: (_, siblingData) => siblingData.type === "pokemon",
         },
      },
      {
         name: "retreatCost",
         type: "number",
         admin: {
            condition: (_, siblingData) => siblingData.type === "pokemon",
         },
      },
      {
         name: "isEX",
         type: "checkbox",
         admin: {
            condition: (_, siblingData) => siblingData.type === "pokemon",
         },
      },
      {
         name: "attacks",
         type: "relationship",
         relationTo: "attacks",
         hasMany: true,
         admin: {
            condition: (_, siblingData) => siblingData.type === "pokemon",
         },
      },
      {
         name: "abilities",
         type: "relationship",
         relationTo: "abilities",
         admin: {
            condition: (_, siblingData) => siblingData.type === "pokemon",
         },
      },
      {
         name: "illustrators",
         type: "relationship",
         relationTo: "illustrators",
         hasMany: true,
      },
      {
         name: "checksum",
         type: "text",
         required: true,
      },
   ],
};
