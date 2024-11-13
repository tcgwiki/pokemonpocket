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
         name: "id",
         type: "text",
      },
      {
         name: "isCollectionPublic",
         type: "checkbox",
         defaultValue: false,
      },
      {
         name: "friendId",
         type: "text",
      },
      {
         name: "username",
         type: "text",
         required: true,
      },
      {
         name: "user",
         type: "text",
         index: true,
         required: true,
      },
      {
         name: "totalUniqueCards",
         type: "number",
      },
   ],
};
