import { Link } from "@remix-run/react";

import { Card, Deck } from "~/db/payload-custom-types";

import { Image } from "~/components/Image";
import { ListTable } from "~/routes/_site+/c_+/_components/ListTable";

import { fuzzyFilter } from "~/routes/_site+/c_+/_components/fuzzyFilter";

import { createColumnHelper } from "@tanstack/react-table";
import { Badge } from "~/components/Badge";

import { ShinyCard } from "../../_site.c.cards+/components/ShinyCard";
import { cardRarityEnum } from "../../_site.c.cards+/components/Cards.Main";
import { Dialog } from "~/components/Dialog";

import { useState } from "react";
import { Button } from "~/components/Button";
import { Icon } from "~/components/Icon";

const columnHelper = createColumnHelper<Card & { count: number }>();

export function DecksDeck({ data }: { data: Deck }) {
   const deck = data;
   const flattenedCards =
      deck.cards?.flatMap((card) => ({ ...card.card, count: card.count })) ||
      [];

   return (
      <>
         <div className="flex justify-between items-center border border-color-sub bg-2-sub p-3 rounded-lg shadow-sm shadow-1 mb-0.5">
            <div className="flex items-center gap-2">
               {deck.deckTypes && (
                  <div className="flex gap-1 justify-center">
                     {deck.deckTypes?.map((type) => (
                        <Image
                           width={32}
                           height={32}
                           url={type.icon?.url}
                           alt={deck.name ?? ""}
                           className="size-5 object-contain"
                        />
                     ))}
                  </div>
               )}
               <div className="text-sm font-semibold">Energy</div>
            </div>
         </div>
         <ListTable
            columnViewability={{
               pokemonType: false,
               cardType: false,
               isEX: false,
            }}
            gridView={deckCardGridView}
            gridContainerClassNames="tablet:grid-cols-5 grid grid-cols-3 gap-2"
            gridCellClassNames="relative flex items-center justify-center"
            defaultViewType="grid"
            defaultSort={[{ id: "rarity", desc: true }]}
            data={{ listData: { docs: flattenedCards } }}
            columns={deckCardColumns}
            filters={deckCardFilters}
            pager={false}
         />
      </>
   );
}

const deckCardGridView = columnHelper.accessor("name", {
   filterFn: fuzzyFilter,
   cell: (info) => {
      const [isOpen, setIsOpen] = useState(false);

      const cardType =
         info.row.original?.cardType === "pokemon" ? "pokémon" : "trainer";

      const rarity =
         info.row.original?.rarity?.name &&
         info.row.original?.rarity.name in cardRarityEnum
            ? cardRarityEnum[
                 info.row.original?.rarity.name as keyof typeof cardRarityEnum
              ]
            : "common";

      return (
         <>
            <Dialog
               className="relative flex items-center justify-center"
               size="tablet"
               onClose={setIsOpen}
               open={isOpen}
            >
               <div className="flex items-center flex-col gap-5 justify-center">
                  {/* @ts-ignore */}
                  <ShinyCard supertype={cardType} rarity={rarity}>
                     <Image
                        className="object-contain"
                        width={367}
                        height={512}
                        url={
                           info.row.original?.icon?.url ??
                           "https://static.mana.wiki/tcgwiki-pokemonpocket/Card_Back.png"
                        }
                        alt={info.row.original?.name ?? "Card Image"}
                     />
                  </ShinyCard>
                  <Button href={`/c/cards/${info.row.original?.slug}`}>
                     Go to card
                     <Icon name="chevron-right" size={16} />
                  </Button>
               </div>
            </Dialog>
            <div className="relative">
               <div className="sr-only">{info.row.original?.name}</div>
               <span className="absolute top-0 right-0 rounded-tr rounded-bl bg-red-500 text-white p-1.5 text-xs font-bold">
                  x{info.row.original?.count}
               </span>
               <button onClick={() => setIsOpen(true)}>
                  <Image
                     className="object-contain"
                     width={367}
                     height={512}
                     url={
                        info.row.original?.icon?.url ??
                        "https://static.mana.wiki/tcgwiki-pokemonpocket/Card_Back.png"
                     }
                     alt={info.row.original?.name ?? "Card Image"}
                  />
               </button>
               <Button
                  className="!absolute bottom-3 right-1 !size-8 !p-0"
                  color="zinc"
                  href={`/c/cards/${info.row.original?.slug}`}
               >
                  <Icon name="chevron-right" size={16} />
               </Button>
            </div>
         </>
      );
   },
});

export const deckCardColumns = [
   columnHelper.accessor("name", {
      header: "Card",
      filterFn: fuzzyFilter,
      cell: (info) => {
         return (
            <Link
               to={`/c/cards/${info.row.original?.slug}`}
               className="flex items-center gap-3 group py-0.5"
            >
               <Image
                  className="w-9 object-contain"
                  width={100}
                  url={
                     info.row.original?.icon?.url ??
                     "https://static.mana.wiki/tcgwiki-pokemonpocket/Card_Back.png"
                  }
               />
               <span
                  className="space-y-1.5 font-semibold group-hover:underline 
                decoration-zinc-400 underline-offset-2 truncate"
               >
                  <div className="truncate">{info.getValue()}</div>
                  {info.row.original?.pokemonType?.icon?.url ? (
                     <Image
                        className="size-4 object-contain"
                        width={40}
                        height={40}
                        url={info.row.original?.pokemonType?.icon?.url}
                     />
                  ) : undefined}
               </span>
            </Link>
         );
      },
   }),
   columnHelper.accessor("pokemonType", {
      header: "Type",
      filterFn: (row, columnId, filterValue) => {
         return filterValue.includes(row?.original?.pokemonType?.name);
      },
   }),
   columnHelper.accessor("weaknessType", {
      header: () => <div className="text-center w-full">Weakness</div>,
      filterFn: (row, columnId, filterValue) => {
         return filterValue.includes(row?.original?.weaknessType?.name);
      },
      cell: (info) => {
         return info.getValue()?.icon?.url ? (
            <Image
               className="size-4 object-contain mx-auto"
               width={40}
               height={40}
               url={info.getValue()?.icon?.url}
            />
         ) : (
            <div className="text-center">-</div>
         );
      },
   }),
   columnHelper.accessor("cardType", {
      filterFn: (row, columnId, filterValue) => {
         return filterValue.includes(row?.original?.cardType?.toString());
      },
   }),
   columnHelper.accessor("isEX", {
      header: "Is EX Pokémon?",
      filterFn: (row, columnId, filterValue) => {
         return filterValue.includes(row?.original?.isEX?.toString());
      },
   }),
   columnHelper.accessor("hp", {
      header: () => <div className="text-center w-full">HP</div>,
      cell: (info) => {
         return (
            <div className="flex items-center justify-center">
               {info.getValue() ? info.getValue() : "-"}
            </div>
         );
      },
   }),
   columnHelper.accessor("count", {
      header: () => <div className="text-right w-full">Qty</div>,
      cell: (info) => {
         return info.getValue() ? (
            <div className="flex items-center justify-end">
               <Badge color="red">x{info.getValue()}</Badge>
            </div>
         ) : (
            "-"
         );
      },
   }),
];

const deckCardFilters: {
   id: string;
   label: string;
   cols?: 1 | 2 | 3 | 4 | 5;
   options: { label?: string; value: string; icon?: string }[];
}[] = [
   {
      id: "cardType",
      label: "Card Type",
      cols: 2,
      options: [
         {
            label: "Pokémon",
            value: "pokemon",
         },
         {
            label: "Trainer",
            value: "trainer",
         },
      ],
   },
   {
      id: "isEX",
      label: "Is EX Pokémon?",
      options: [
         {
            label: "EX Pokémon",
            value: "true",
         },
      ],
   },
   {
      id: "pokemonType",
      label: "Pokémon Type",
      cols: 3,
      options: [
         {
            label: "Colorless",
            value: "Colorless",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Colorless.png",
         },
         {
            label: "Metal",
            value: "Metal",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Metal.png",
         },
         {
            label: "Darkness",
            value: "Darkness",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Darkness.png",
         },
         {
            label: "Dragon",
            value: "Dragon",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Dragon.png",
         },
         {
            label: "Fighting",
            value: "Fighting",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Fighting.png",
         },
         {
            label: "Fire",
            value: "Fire",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Fire.png",
         },
         {
            label: "Grass",
            value: "Grass",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Grass.png",
         },
         {
            label: "Lightning",
            value: "Lightning",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Lightning.png",
         },
         {
            label: "Psychic",
            value: "Psychic",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Psychic.png",
         },

         {
            label: "Water",
            value: "Water",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Water.png",
         },
      ],
   },
   {
      id: "weaknessType",
      label: "Pokémon Weakness",
      cols: 3,
      options: [
         {
            label: "Colorless",
            value: "Colorless",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Colorless.png",
         },
         {
            label: "Metal",
            value: "Metal",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Metal.png",
         },
         {
            label: "Darkness",
            value: "Darkness",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Darkness.png",
         },
         {
            label: "Dragon",
            value: "Dragon",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Dragon.png",
         },
         {
            label: "Fighting",
            value: "Fighting",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Fighting.png",
         },
         {
            label: "Fire",
            value: "Fire",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Fire.png",
         },
         {
            label: "Grass",
            value: "Grass",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Grass.png",
         },
         {
            label: "Lightning",
            value: "Lightning",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Lightning.png",
         },
         {
            label: "Psychic",
            value: "Psychic",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Psychic.png",
         },
         {
            label: "Water",
            value: "Water",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Water.png",
         },
      ],
   },
];
