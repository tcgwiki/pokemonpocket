import { useState } from "react";

import {
   Disclosure,
   DisclosureButton,
   DisclosurePanel,
} from "@headlessui/react";
import { Link } from "@remix-run/react";
import { createColumnHelper } from "@tanstack/react-table";
import clsx from "clsx";

import { Badge } from "~/components/Badge";
import { Button } from "~/components/Button";
import { Dialog } from "~/components/Dialog";
import { Icon } from "~/components/Icon";
import { Image } from "~/components/Image";
import type { Card, Deck } from "~/db/payload-custom-types";
import { fuzzyFilter } from "~/routes/_site+/c_+/_components/fuzzyFilter";
import { ListTable } from "~/routes/_site+/c_+/_components/ListTable";

import { cardRarityEnum } from "../../_site.c.cards+/components/Cards.Main";
import { ShinyCard } from "../../_site.c.cards+/components/ShinyCard";
import { TextLink } from "~/components/Text";

import { CustomEditorEmbed } from "~/routes/_editor+/core/components/CustomEditorEmbed";
import { ContentEmbed } from "~/db/payload-types";

const columnHelper = createColumnHelper<Card & { count: number }>();

export function DecksDeck({
   data,
}: {
   data: { deck: Deck & { deckBuildContent: ContentEmbed[] } };
}) {
   //@ts-ignore
   const { deck, deckBuildContent } = data;

   const decks =
      deck.builds?.map((build) => {
         return {
            id: build.id,
            name: build.name,
            buildContent: deckBuildContent.find(
               (content: ContentEmbed) => content.relationId === build.id,
            ),
            cards: build.cards?.flatMap((card) => ({
               ...card.card,
               count: card.count,
            })),
         };
      }) || [];

   return (
      <>
         {decks.map((deckRow, _deckRowIndex) => (
            <Disclosure defaultOpen={true} key={_deckRowIndex}>
               {({ open }) => (
                  <>
                     <DisclosureButton
                        className={clsx(
                           open ? "rounded-b-none " : "mb-2.5 shadow-sm",
                           "shadow-1 border-color-sub bg-zinc-50 dark:bg-dark350 flex w-full items-center gap-2 overflow-hidden rounded-xl border px-2 py-3",
                        )}
                     >
                        <div className="flex size-7 flex-none items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm shadow-zinc-200  dark:border-zinc-600 dark:bg-dark450 dark:shadow-zinc-800">
                           <Icon
                              name="chevron-right"
                              className={clsx(
                                 open ? "rotate-90" : "",
                                 "transform pl-0.5 transition duration-300 ease-in-out",
                              )}
                              size={16}
                           />
                        </div>
                        <div className="flex-grow text-left text-lg font-bold font-header">
                           {deckRow.name}
                        </div>
                     </DisclosureButton>
                     <DisclosurePanel
                        contentEditable={false}
                        unmount={false}
                        className={clsx(
                           open ? "mb-3 border-t" : "",
                           "border-color-sub shadow-1 bg-3 rounded-b-lg border border-t-0 p-3 shadow-sm",
                        )}
                     >
                        <CustomEditorEmbed
                           data={deckRow.buildContent?.content}
                           siteId="66fb8ddbc707d9f8d3f8a435-k3a3m64els5y"
                           relationId={deckRow.id}
                           pageId={deckRow?.buildContent?.id ?? ""}
                        />
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
                           data={{ listData: { docs: deckRow.cards } }}
                           columns={deckCardColumns}
                           filters={deckCardFilters}
                           pager={false}
                        />
                     </DisclosurePanel>
                  </>
               )}
            </Disclosure>
         ))}
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
               <div
                  className="flex items-center flex-col gap-5 justify-center"
                  style={{
                     viewTransitionName: info.row.original?.slug ?? undefined,
                  }}
               >
                  {/* @ts-ignore */}
                  <ShinyCard supertype={cardType} rarity={rarity}>
                     <Image
                        className="object-contain"
                        width={367}
                        height={512}
                        url={
                           info.row.original?.icon?.url ??
                           "https://static.mana.wiki/tcgwiki-pokemonpocket/CardIcon_Card_Back.png"
                        }
                        alt={info.row.original?.name ?? "Card Image"}
                        loading="lazy"
                     />
                  </ShinyCard>
                  <Button href={`/c/cards/${info.row.original?.slug}`}>
                     Go to card
                     <Icon name="chevron-right" size={16} />
                  </Button>
               </div>
            </Dialog>
            <>
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
                        "https://static.mana.wiki/tcgwiki-pokemonpocket/CardIcon_Card_Back.png"
                     }
                     alt={info.row.original?.name ?? "Card Image"}
                     loading="lazy"
                  />
               </button>
            </>
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
                     "https://static.mana.wiki/tcgwiki-pokemonpocket/CardIcon_Card_Back.png"
                  }
                  loading="lazy"
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
                        loading="lazy"
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
               loading="lazy"
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
