import type { CollectionConfig } from "payload/types";
import {
   afterDeleteSearchSyncHook,
   afterChangeSearchSyncHook,
} from "../hooks/search-hooks";

import { isStaff } from "../../db/collections/users/users.access";
import { User } from "payload/dist/auth";

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
         name: "isPublic",
         type: "checkbox",
         defaultValue: false,
      },
      {
         name: "slug",
         type: "text",
      },
      {
         name: "user",
         type: "text",
         defaultValue: ({ user }: { user: User }) => user?.id,
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
         maxRows: 3,
      },
      {
         name: "archetype",
         type: "relationship",
         relationTo: "archetypes",
      },
      {
         name: "types",
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
               relationTo: "card-groups",
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
