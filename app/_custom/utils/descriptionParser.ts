import { cardTypes } from "./cardTypes";

export function descriptionParser(desc: string) {
   return desc.replace(/<span data-element-id=(\d+)\/>/g, (match, id) => {
      // You might want to replace this with actual icon mapping logic
      const cardType = cardTypes.find((type) => type.id === id);
      const getTypeIcon = (id: string) =>
         `<img class="inline-block" width="14" height="14" src="${cardType?.icon}" />`;
      return getTypeIcon(id);
   });
}
