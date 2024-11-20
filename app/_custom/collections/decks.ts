import type { CollectionConfig } from "payload/types";

import { isStaff } from "../../db/collections/users/users.access";
import { User } from "payload/dist/auth";
import { number } from "zod";

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
         name: "isPublic",
         type: "checkbox",
         defaultValue: false,
      },
      {
         name: "slug",
         type: "text",
      },
      {
         name: "description",
         type: "json",
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
         name: "upVotes",
         type: "relationship",
         relationTo: "users",
         hasMany: true,
      },
      {
         name: "maxCommentDepth",
         type: "number",
      },
      {
         name: "totalComments",
         type: "number",
      },
      {
         name: "tournament",
         type: "group",
         fields: [
            {
               name: "user",
               type: "relationship",
               relationTo: "tournament-users",
               hasMany: false,
            },
            {
               name: "placing",
               type: "number",
            },
            {
               name: "wins",
               type: "number",
            },
            {
               name: "losses",
               type: "number",
            },
            {
               name: "ties",
               type: "number",
            },
            {
               name: "drop",
               type: "number",
            },
         ],
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
