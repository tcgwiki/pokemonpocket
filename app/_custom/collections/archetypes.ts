import type { CollectionConfig } from "payload/types";
import {
   afterDeleteSearchSyncHook,
   afterChangeSearchSyncHook,
} from "../hooks/search-hooks";

import { isStaff } from "../../db/collections/users/users.access";

export const Archetypes: CollectionConfig = {
   slug: "archetypes",
   labels: { singular: "Archetype", plural: "Archetypes" },
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
   hooks: {
      afterDelete: [afterDeleteSearchSyncHook],
      afterChange: [afterChangeSearchSyncHook],
   },
   fields: [
      {
         name: "name",
         type: "text",
      },
      {
         name: "limitlessArchetypeId",
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
         name: "tier",
         type: "select",
         options: [
            { label: "C Tier", value: "c" },
            { label: "B Tier", value: "b" },
            { label: "A Tier", value: "a" },
            { label: "S Tier", value: "s" },
         ],
      },
      {
         name: "highlightCards",
         type: "relationship",
         relationTo: "card-groups",
         hasMany: true,
      },
      {
         name: "types",
         type: "relationship",
         relationTo: "types",
         hasMany: true,
      },
      {
         name: "featuredDecks",
         type: "relationship",
         relationTo: "decks",
         hasMany: true,
      },
   ],
};
