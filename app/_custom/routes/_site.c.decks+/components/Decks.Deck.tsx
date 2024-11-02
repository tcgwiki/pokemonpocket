import { useEffect, useState } from "react";
import { Link, useFetcher, useLoaderData } from "@remix-run/react";
import { createColumnHelper } from "@tanstack/react-table";

import { Button } from "~/components/Button";
import { Dialog } from "~/components/Dialog";
import { Icon } from "~/components/Icon";
import { Image } from "~/components/Image";
import type { Card } from "~/db/payload-custom-types";
import { fuzzyFilter } from "~/routes/_site+/c_+/_components/fuzzyFilter";
import { ListTable } from "~/routes/_site+/c_+/_components/ListTable";

import { cardRarityEnum } from "../../_site.c.cards+/components/Cards.Main";
import { ShinyCard } from "../../_site.c.cards+/components/ShinyCard";
import { DeckLoaderData } from "../$entryId";
import clsx from "clsx";
import { isAdding } from "~/utils/form";
import { useRootLoaderData } from "~/utils/useSiteLoaderData";
import { Input, InputGroup } from "~/components/Input";
import { useDebouncedValue, useIsMount } from "~/utils/use-debounce";
import { ListboxLabel, ListboxOption, Listbox } from "~/components/Listbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/Tooltip";
import {
   Dropdown,
   DropdownButton,
   DropdownItem,
   DropdownMenu,
} from "~/components/Dropdown";

const deckBuilderTrayColumnHelper = createColumnHelper<Card>();

export function DecksDeck({ data }: { data: DeckLoaderData }) {
   const { deck, allCards, deckCards, archetypes } = data;
   const { user } = useRootLoaderData();

   const isOwner = deck.user === user?.id;
   const fetcher = useFetcher();
   const isMount = useIsMount();

   const [deckName, setDeckName] = useState(deck.name);
   const debouncedDeckName = useDebouncedValue(deckName, 500);

   useEffect(() => {
      if (!isMount) {
         fetcher.submit(
            {
               deckId: deck.id,
               deckName: debouncedDeckName ?? "",
               intent: "updateDeckName",
            },
            { method: "POST" },
         );
      }
   }, [debouncedDeckName]);

   const isDeckNameUpdating = isAdding(fetcher, "updateDeckName");

   const isArchetypeUpdating = isAdding(fetcher, "updateArchetype");
   const isDeleting = isAdding(fetcher, "deleteDeck");
   const disabled = isDeckNameUpdating || isArchetypeUpdating;

   return (
      <div>
         {isOwner && (
            <>
               <div className="flex items-start gap-2">
                  <div className="flex-grow">
                     <InputGroup>
                        {isDeckNameUpdating ? (
                           <Icon
                              name="loader-2"
                              size={16}
                              className="animate-spin"
                           />
                        ) : (
                           <Icon name="text" size={16} />
                        )}
                        <Input
                           disabled={disabled}
                           className="mb-4 w-full"
                           defaultValue={deck.name ?? ""}
                           name="deckName"
                           type="text"
                           onChange={(e: any) => {
                              setDeckName(e.target.value);
                           }}
                        />
                     </InputGroup>
                  </div>
                  <Dropdown>
                     <DropdownButton color="light/zinc" className="h-9">
                        <Icon name="ellipsis" size={16} />
                     </DropdownButton>
                     <DropdownMenu>
                        <DropdownItem
                           onClick={() => {
                              fetcher.submit(
                                 { deckId: deck.id, intent: "deleteDeck" },
                                 { method: "POST" },
                              );
                           }}
                        >
                           Delete
                        </DropdownItem>
                     </DropdownMenu>
                  </Dropdown>
                  {/* <Button
                     color="red"
                     onClick={() => {
                        fetcher.submit(
                           { deckId: deck.id, intent: "deleteDeck" },
                           { method: "POST" },
                        );
                     }}
                  >
                     {isDeleting ? (
                        <Icon
                           name="loader-2"
                           size={16}
                           className="animate-spin"
                        />
                     ) : (
                        <Icon name="trash" size={16} />
                     )}
                  </Button> */}
               </div>
               <Listbox
                  disabled={disabled}
                  className="mb-4"
                  value={deck.archetype?.id ?? ""}
                  defaultValue={deck.archetype?.id}
                  onChange={(archetypeId: string) => {
                     fetcher.submit(
                        {
                           deckId: deck.id,
                           archetypeId,
                           intent: "updateArchetype",
                        },
                        { method: "POST" },
                     );
                  }}
               >
                  {archetypes.map((archetype) => (
                     <ListboxOption key={archetype.id} value={archetype.id}>
                        <ListboxLabel>{archetype.name}</ListboxLabel>
                     </ListboxOption>
                  ))}
               </Listbox>

               <div className="border border-color-sub px-3 rounded-xl pb-1 mb-4">
                  <ListTable
                     columnViewability={{
                        pokemonType: false,
                        cardType: false,
                        isEX: false,
                     }}
                     pageSize={allCards.length}
                     gridView={deckBuilderTrayGridView}
                     gridContainerClassNames="whitespace-nowrap overflow-y-hidden overflow-x-auto space-x-2 
                     dark:scrollbar-thumb-dark500 dark:scrollbar-track-bg2Dark
                     scrollbar-thumb-zinc-200 scrollbar-track-zinc-50 scrollbar"
                     gridCellClassNames="relative inline-flex items-center justify-center w-24"
                     defaultViewType="grid"
                     data={{ listData: { docs: allCards } }}
                     columns={deckBuilderTrayColumns}
                     filters={deckCardFilters}
                     pager={false}
                  />
               </div>
            </>
         )}
         <div className="border border-color-sub rounded-xl p-2 bg-2-sub mb-4">
            {deckCards?.length ? (
               <div className="tablet:grid-cols-5 grid grid-cols-3 gap-2">
                  {deckCards.map((card) => {
                     return (
                        <DeckCell
                           key={card.id}
                           card={card}
                           isOwner={isOwner}
                           count={card.count}
                        />
                     );
                  })}
               </div>
            ) : (
               <div className="text-center text-sm text-zinc-500">
                  No cards in deck
               </div>
            )}
         </div>
      </div>
   );
}

function DeckCell({
   card,
   count,
   isOwner,
}: {
   card: Card | undefined;
   count: number | null | undefined;
   isOwner: boolean;
}) {
   const [isOpen, setIsOpen] = useState(false);

   const cardType = card?.cardType === "pokemon" ? "pokémon" : "trainer";

   const rarity =
      card?.rarity?.name && card.rarity.name in cardRarityEnum
         ? cardRarityEnum[card.rarity.name as keyof typeof cardRarityEnum]
         : "common";

   const fetcher = useFetcher();
   const { entry } = useLoaderData<any>();

   const isCardUpdating = isAdding(fetcher, "updateCardInDeck");
   const disabled = isCardUpdating;

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
                  viewTransitionName: card?.slug ?? undefined,
               }}
            >
               {/* @ts-ignore */}
               <ShinyCard supertype={cardType} rarity={rarity}>
                  <Image
                     className="object-contain"
                     width={367}
                     height={512}
                     url={
                        card?.icon?.url ??
                        "https://static.mana.wiki/tcgwiki-pokemonpocket/CardIcon_Card_Back.png"
                     }
                     alt={card?.name ?? "Card Image"}
                     loading="lazy"
                  />
               </ShinyCard>
               <Button href={`/c/cards/${card?.slug}`}>
                  Go to card
                  <Icon name="chevron-right" size={16} />
               </Button>
            </div>
         </Dialog>
         <button
            disabled={disabled}
            onClick={
               !isOwner
                  ? () => setIsOpen(true)
                  : () => {
                       fetcher.submit(
                          //@ts-ignore
                          {
                             deckId: entry.id,
                             cardId: card?.id,
                             cardCount: count,
                             intent: "updateCardInDeck",
                          },
                          {
                             method: "POST",
                          },
                       );
                    }
            }
            className="relative"
         >
            <div className="sr-only">{card?.name}</div>
            <Image
               className={clsx(
                  "object-contain",
                  isCardUpdating && "opacity-50",
               )}
               width={367}
               height={512}
               url={
                  card?.icon?.url ??
                  "https://static.mana.wiki/tcgwiki-pokemonpocket/CardIcon_Card_Back.png"
               }
               alt={card?.name ?? "Card Image"}
               loading="lazy"
            />
            <div
               className="absolute bottom-1 right-1 text-xs text-white font-bold
                   size-6 rounded-md flex items-center justify-center bg-zinc-900"
            >
               {count}
            </div>
            {isCardUpdating && (
               <div className=" z-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <Icon name="loader-2" size={20} className="animate-spin" />
               </div>
            )}
         </button>
      </>
   );
}

const deckBuilderTrayGridView = deckBuilderTrayColumnHelper.accessor("name", {
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

      const fetcher = useFetcher();

      const isCardAdding = isAdding(fetcher, "addCardToDeck");

      const isHighlighting = isAdding(fetcher, "highlightCard");
      const disabled = isCardAdding;

      const { entry } = useLoaderData<any>();
      //@ts-ignore
      const isHighlighted = info.row.original?.isHighlighted;

      return (
         <div className="relative group">
            <Tooltip>
               <TooltipTrigger
                  onClick={() => {
                     fetcher.submit(
                        {
                           deckId: entry.id,
                           cardId: info.row.original?.id,
                           intent: "highlightCard",
                        },
                        { method: "POST" },
                     );
                  }}
                  className={clsx(
                     "hidden group-hover:block absolute top-1 right-1 rounded-md p-1 z-20",
                     isHighlighted ? "bg-yellow-500" : "bg-zinc-900",
                  )}
               >
                  {isHighlighting ? (
                     <Icon name="loader-2" className="animate-spin" size={12} />
                  ) : (
                     <Icon
                        name="star"
                        className={clsx(
                           isHighlighted ? "text-yellow-800" : "text-white",
                        )}
                        title="Add to Highlights"
                        size={12}
                     />
                  )}
               </TooltipTrigger>
               <TooltipContent>
                  {isHighlighted ? "Remove" : "Add to Highlights"}
               </TooltipContent>
            </Tooltip>
            <button
               disabled={disabled}
               onClick={() => {
                  fetcher.submit(
                     {
                        deckId: entry.id,
                        cardId: info.row.original?.id,
                        intent: "addCardToDeck",
                     },
                     {
                        method: "POST",
                     },
                  );
               }}
            >
               <Tooltip placement="right">
                  <TooltipTrigger className="group">
                     <Image
                        className={clsx(
                           "object-contain transition-all duration-150 ease-in-out hover:cursor-pointer hover:opacity-80",
                           isCardAdding && "opacity-50",
                        )}
                        width={367}
                        height={512}
                        url={
                           info.row.original?.icon?.url ??
                           "https://static.mana.wiki/tcgwiki-pokemonpocket/CardIcon_Card_Back.png"
                        }
                        alt={info.row.original?.name ?? "Card Image"}
                        loading="lazy"
                     />
                     {isCardAdding ? (
                        <div className=" z-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                           <Icon
                              name="loader-2"
                              size={20}
                              className="animate-spin"
                           />
                        </div>
                     ) : (
                        <Icon
                           name="plus"
                           size={20}
                           className="dark:text-white text-zinc-900 absolute opacity-0 group-hover:opacity-100 transition-all 
                           ease-in-out top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                        />
                     )}
                  </TooltipTrigger>
                  <TooltipContent>
                     <Image
                        className={clsx(
                           "object-contain w-[300px]",
                           isCardAdding && "opacity-50",
                        )}
                        width={367}
                        height={512}
                        url={
                           info.row.original?.icon?.url ??
                           "https://static.mana.wiki/tcgwiki-pokemonpocket/CardIcon_Card_Back.png"
                        }
                        alt={info.row.original?.name ?? "Card Image"}
                        loading="lazy"
                     />
                  </TooltipContent>
               </Tooltip>
            </button>
         </div>
      );
   },
});

export const deckBuilderTrayColumns = [
   deckBuilderTrayColumnHelper.accessor("name", {
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
   deckBuilderTrayColumnHelper.accessor("pokemonType", {
      header: "Type",
      filterFn: (row, columnId, filterValue) => {
         return filterValue.includes(row?.original?.pokemonType?.name);
      },
   }),
   deckBuilderTrayColumnHelper.accessor("weaknessType", {
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
   deckBuilderTrayColumnHelper.accessor("cardType", {
      filterFn: (row, columnId, filterValue) => {
         return filterValue.includes(row?.original?.cardType?.toString());
      },
   }),
   deckBuilderTrayColumnHelper.accessor("isEX", {
      header: "Is EX Pokémon?",
      filterFn: (row, columnId, filterValue) => {
         return filterValue.includes(row?.original?.isEX?.toString());
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
