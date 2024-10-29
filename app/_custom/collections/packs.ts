import type { CollectionConfig } from "payload/types";
import {
   afterDeleteSearchSyncHook,
   afterChangeSearchSyncHook,
} from "../hooks/search-hooks";

import { isStaff } from "../../db/collections/users/users.access";

export const Packs: CollectionConfig = {
   slug: "packs",
   labels: { singular: "Pack", plural: "Packs" },
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
         name: "expansion",
         type: "relationship",
         relationTo: "expansions",
      },
      {
         name: "cards",
         type: "relationship",
         relationTo: "pack-cards",
         hasMany: true,
      },
      {
         name: "checksum",
         type: "text",
         required: true,
      },
   ],
};
