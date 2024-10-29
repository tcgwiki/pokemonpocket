import type { CollectionConfig } from "payload/types";
import type { User } from "payload/generated-types";

import { isStaff } from "../../db/collections/users/users.access";

export const UserCards: CollectionConfig = {
   slug: "user-cards",
   labels: { singular: "User Card", plural: "User Cards" },
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
         name: "card",
         type: "relationship",
         relationTo: "cards",
         index: true,
         hasMany: false,
         required: true,
      },
      {
         name: "count",
         type: "number",
         required: true,
      },
      {
         name: "user",
         type: "text",
         index: true,
         required: true,
      },
   ],
};
