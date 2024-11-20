import { nanoid } from "nanoid";
import { DefaultElement, useReadOnly } from "slate-react";

import { Icon } from "~/components/Icon";

import { DeckBlock } from "./DeckBlock";

enum BlockType {
   CustomComponent = "customComponent",
   DeckBlock = "deckBlock",
}

type CustomComponent = {
   id: string;
   type: BlockType.CustomComponent;
   children: [{ text: "" }];
};

export const CustomBlocks = ({ element, children, attributes }: any) => {
   switch (element.type) {
      case BlockType.DeckBlock: {
         return <DeckBlock element={element} children={children} />;
      }
      default:
         //Render default element if no custom blocks match
         return (
            <DefaultElement element={element} attributes={attributes}>
               {children}
            </DefaultElement>
         );
   }
};

export const CustomBlocksAddConfig = (onSelect: any) => {
   return {
      // label: "Custom",
      // items: [
      //    {
      //       label: "Sample Component",
      //       icon: <Icon name="component" size={20} />,
      //       description: "Sample component description",
      //       onSelect: () => {
      //          onSelect({
      //             id: nanoid(),
      //             stringField: "test",
      //             type: BlockType.CustomComponent,
      //             children: [{ text: "" }],
      //          });
      //       },
      //    },
      // ],
      label: "Deck",
      items: [
         {
            label: "Embed Deck",
            icon: <Icon name="component" size={20} />,
            description: "Embed a deck from a deck link",
            onSelect: () => {
               onSelect({
                  id: nanoid(),
                  type: BlockType.DeckBlock,
                  children: [{ text: "" }],
               });
            },
         },
      ],
   };
};
