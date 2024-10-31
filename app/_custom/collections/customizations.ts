import type { CollectionConfig } from "payload/types";
import { afterDeleteSearchSyncHook, afterChangeSearchSyncHook } from "../hooks/search-hooks";
import { isStaff } from "../../db/collections/users/users.access";

export const Customizations: CollectionConfig = {
   slug: "customizations",
   labels: { singular: "Customization", plural: "Customizations" },
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
         name: "icon",
         type: "upload",
         relationTo: "images",
      },
      {
         name: "type",
         type: "select",
         options: [
            // Lettuce.Muscle.PeripheralGoodsType
            { label: "Playmat", value: "PLAY_MAT" },
            { label: "Sleeve", value: "DECK_SHIELD" },
            { label: "Coin", value: "COIN_SKIN" },
            { label: "Binder", value: "COLLECTION_FILE" },
            { label: "Display", value: "COLLECTION_BOARD" },
            // Custom.
            { label: "Card Skin", value: "CARD_SKIN" },
            // Lettuce.Muscle.ProfileDecorationType
            { label: "Icon", value: "ICON" },
            { label: "Emblem", value: "EMBLEM" },
         ],
      },
      {
         name: "skinType",
         type: "select",
         admin: {
            condition: (_, siblingData) => siblingData.type === "CARD_SKIN",
         },
         options: [
            // Lettuce.Muscle.CardSkinType
            { label: "Decoration", value: "Decoration" },
            { label: "Battle Effect", value: "BattleEffect" }
         ]
      },
      {
         name: "image",
         type: "upload",
         relationTo: "images",
      },
      {
         name: "checksum",
         type: "text",
         required: true,
      },
   ],
};
