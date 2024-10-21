import type { CollectionConfig } from "payload/types";
import type { User } from "payload/generated-types";

import { isStaff } from "../../db/collections/users/users.access";

export const UserCardCollections: CollectionConfig = {
   slug: "user-card-collections",
   labels: {
      singular: "User Card Collection",
      plural: "User Card Collections",
   },
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
         name: "user",
         type: "text",
         required: true,
      },
      {
         name: "totalCards",
         type: "number",
      },
      {
         name: "publicLink",
         type: "text",
      },
   ],
};
