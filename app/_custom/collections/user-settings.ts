import type { CollectionConfig } from "payload/types";

import { isStaff } from "../../db/collections/users/users.access";

export const UserSettings: CollectionConfig = {
   slug: "user-settings",
   labels: { singular: "User Settings", plural: "User Settings" },
   admin: {
      group: "Custom",
      useAsTitle: "name",
   },
   access: {
      create: isStaff,
      read: isStaff,
      update: isStaff,
      delete: isStaff,
   },
   fields: [
      {
         name: "isCollectionPublic",
         type: "checkbox",
         defaultValue: false,
      },
      {
         name: "user",
         type: "text",
         index: true,
         required: true,
      },
   ],
};
