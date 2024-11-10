import type {
   ActionFunction,
   LoaderFunctionArgs,
   MetaFunction,
} from "@remix-run/node";
import {
   json,
   Link,
   redirect,
   useFetcher,
   useLoaderData,
} from "@remix-run/react";
import { createColumnHelper } from "@tanstack/react-table";
import { gql } from "graphql-request";

import { Image } from "~/components/Image";

import type { Card, User } from "payload/generated-custom-types";
import { fuzzyFilter } from "~/routes/_site+/c_+/_components/fuzzyFilter";
import { ListTable } from "~/routes/_site+/c_+/_components/ListTable";
import { authRestFetcher, gqlFetch } from "~/utils/fetchers.server";
import { useState } from "react";
import { cardRarityEnum } from "./_site.c.cards+/components/Cards.Main";
import { Dialog } from "~/components/Dialog";
import { Button } from "~/components/Button";
import { ShinyCard } from "./_site.c.cards+/components/ShinyCard";
import { Icon } from "~/components/Icon";
import { jsonWithError, jsonWithSuccess } from "remix-toast";
import { z } from "zod";
import { zx } from "zodix";
import { isAdding } from "~/utils/form";
import clsx from "clsx";
import { DialogTitle, Label } from "@headlessui/react";
import {
   Disclosure,
   DisclosureButton,
   DisclosurePanel,
} from "@headlessui/react";
import { Badge } from "~/components/Badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/Tooltip";
import ListTableContainer from "~/routes/_site+/c_+/_components/ListTableContainer";
import qs from "qs";
import { Switch, SwitchField } from "~/components/Switch";

type CollectionData = {
   userCards: {
      cards: {
         docs: Array<{
            id: string;
            card: Card;
            count: number;
            user: string;
            isOwned: boolean;
         }>;
      };
      allCards: { docs: Array<Card> };
   };
   user: User;
};

export async function loader({
   request,
   context: { user },
}: LoaderFunctionArgs) {
   const userCards = (await gqlFetch({
      isAuthOverride: true,
      isCustomDB: true,
      isCached: user ? false : true,
      query: QUERY,
      request,
      variables: {
         userId: user?.id ?? "",
      },
   })) as CollectionData["userCards"];

   const userCardMap = new Map(
      userCards.cards.docs.map((item) => [item.card.id, item]),
   );

   const cardsList = userCards.allCards.docs
      .map((card) => {
         const userCard = userCardMap.get(card.id);
         return {
            ...card,
            id: userCard?.id ?? card.id,
            user: userCard?.user,
            count: userCard?.count ?? 0,
            isOwned: !!userCard,
         };
      })
      .sort((a, b) => {
         // Sort owned cards first
         if (a.isOwned && !b.isOwned) return -1;
         if (!a.isOwned && b.isOwned) return 1;
         return 0;
      });

   const groupedCards = cardsList.reduce(
      (groups, card) => {
         const expansionName = card.expansion?.slug || "Unknown Expansion";
         const cardId = card.id;

         // Initialize expansion group if it doesn't exist
         if (!groups[expansionName]) {
            groups[expansionName] = {
               expansionName: expansionName,
               expansionIcon: card.expansion?.icon?.url ?? undefined,
               expansionLogo: card.expansion?.logo?.url ?? undefined,
               packs: {},
               totalCards: 0,
               ownedCards: 0,
               processedCardIds: new Set<string>(),
            };
         }

         // Only increment expansion totals if this is the first time we've seen this card
         if (!groups[expansionName]!.processedCardIds.has(cardId)) {
            groups[expansionName]!.processedCardIds.add(cardId);
            groups[expansionName]!.totalCards++;
            if (card.isOwned) {
               groups[expansionName]!.ownedCards++;
            }
         }

         // If card has no packs or empty packs array, add to "No Pack"
         if (!card.packs || card.packs.length === 0) {
            const noPack = "No Pack";
            if (!groups[expansionName]!.packs[noPack]) {
               groups[expansionName]!.packs[noPack] = {
                  id: "no-pack",
                  name: noPack,
                  icon: undefined,
                  cards: [],
                  totalCards: 0,
                  ownedCards: 0,
               };
            }
            groups[expansionName]!.packs[noPack]!.cards.push(card);
            groups[expansionName]!.packs[noPack]!.totalCards++;
            if (card.isOwned) {
               groups[expansionName]!.packs[noPack]!.ownedCards++;
            }
         } else {
            // Handle cards with packs
            card.packs.forEach((packData) => {
               const packName = packData.name ?? "Unknown Pack";

               if (!groups[expansionName]!.packs[packName]) {
                  groups[expansionName]!.packs[packName] = {
                     id: packData.id,
                     name: packData.name ?? "",
                     icon: packData.icon?.url ?? undefined,
                     cards: [],
                     totalCards: 0,
                     ownedCards: 0,
                  };
               }

               groups[expansionName]!.packs[packName]!.cards.push(card);
               groups[expansionName]!.packs[packName]!.totalCards++;
               if (card.isOwned) {
                  groups[expansionName]!.packs[packName]!.ownedCards++;
               }
            });
         }

         return groups;
      },
      {} as Record<
         string,
         {
            expansionName: string;
            expansionIcon?: string;
            expansionLogo?: string;
            packs: Record<
               string,
               {
                  id: string;
                  name: string;
                  icon?: string;
                  cards: typeof cardsList;
                  totalCards: number;
                  ownedCards: number;
               }
            >;
            totalCards: number;
            ownedCards: number;
            processedCardIds: Set<string>;
         }
      >,
   );

   // Clean up by removing the processedCardIds set before using the data
   const cleanedGroupedCards = Object.entries(groupedCards).reduce(
      (acc, [key, value]) => {
         acc[key] = value;
         return acc;
      },
      {} as typeof groupedCards,
   );

   const totalOwnedCards = Object.values(cleanedGroupedCards).reduce(
      (total, packData) => total + packData.ownedCards,
      0,
   );

   // Calculate both owned and total cards by type
   const cardsByType = cardsList.reduce(
      (acc, card) => {
         if (card.pokemonType?.name) {
            const typeName = card.pokemonType.name;
            if (!acc[typeName]) {
               acc[typeName] = {
                  owned: 0,
                  total: 0,
                  icon: card.pokemonType.icon?.url ?? undefined,
               };
            }

            // Only increment total once per unique card
            acc[typeName]!.total++;

            // If owned, only count it once (not by count)
            if (card.isOwned) {
               acc[typeName]!.owned++;
            }
         }
         return acc;
      },
      {} as Record<
         string,
         {
            owned: number;
            total: number;
            icon?: string;
         }
      >,
   );

   // Updated rarity order mapping (reversed)
   const rarityOrder = {
      UR: 0, // Ultra Rare (highest)
      IM: 1, // Illustration Rare
      SAR: 2, // Special Art Rare
      SR: 3, // Secret Rare
      AR: 4, // Amazing Rare
      RR: 5, // Rare Rare
      R: 6, // Rare
      U: 7, // Uncommon
      C: 8, // Common (lowest)
   };

   const cardsByRarity = Object.entries(
      cardsList.reduce(
         (acc, card) => {
            if (card.rarity?.name) {
               const rarityName = card.rarity.name;
               if (!acc[rarityName]) {
                  acc[rarityName] = {
                     owned: 0,
                     total: 0,
                     icon: card.rarity.icon?.url ?? undefined,
                     order:
                        rarityOrder[rarityName as keyof typeof rarityOrder] ??
                        999,
                  };
               }

               acc[rarityName]!.total++;
               if (card.isOwned) {
                  acc[rarityName]!.owned++;
               }
            }
            return acc;
         },
         {} as Record<
            string,
            {
               owned: number;
               total: number;
               icon?: string;
               order: number;
            }
         >,
      ),
   )
      .sort(([, a], [, b]) => a.order - b.order) // Keeping this the same since we reversed the order values
      .reduce(
         (obj, [key, value]) => {
            const { order, ...rest } = value;
            obj[key] = rest;
            return obj;
         },
         {} as Record<string, { owned: number; total: number; icon?: string }>,
      );

   // Calculate total owned and available Pokemon/Trainer cards
   const cardTypeStats = cardsList.reduce(
      (acc, card) => {
         const isTrainer = card.cardType === "trainer";

         // Increment total counts
         if (isTrainer) {
            acc.trainerTotal++;
         } else {
            acc.pokemonTotal++;
         }

         // Increment owned counts
         if (card.isOwned) {
            if (isTrainer) {
               acc.trainerOwned++;
            } else {
               acc.pokemonOwned++;
            }
         }

         return acc;
      },
      { pokemonOwned: 0, pokemonTotal: 0, trainerOwned: 0, trainerTotal: 0 },
   );

   return json({
      userCards: cardsList,
      user,
      groupedCards: cleanedGroupedCards as ExpansionViewProps["groupedCards"],
      totalOwnedCards,
      cardsByType,
      cardsByRarity,
      cardTypeStats,
   });
}

export const meta: MetaFunction = () => {
   return [
      {
         title: "Collection Tracker | Pokémon TCG Pocket - TCG Wiki",
      },
   ];
};

export default function CollectionTracker() {
   const {
      userCards,
      user,
      groupedCards,
      totalOwnedCards,
      cardsByType,
      cardsByRarity,
      cardTypeStats,
   } = useLoaderData<typeof loader>();

   const [isSetView, setIsSetView] = useState(false);

   return (
      <div className="relative z-20 mx-auto max-w-[1200px] justify-center px-3 pb-4">
         <div className="pt-4 desktop:flex items-start gap-3 border-b pb-3 border-color-sub">
            <div>
               <div
                  className="border border-zinc-200 shadow-sm bg-zinc-50 divide-y divide-color-sub tablet:min-w-48 desktop:max-w-48å
                  shadow-zinc-100 dark:border-zinc-600 dark:bg-dark450 dark:shadow-zinc-800 rounded-lg flex-none max-desktop:mb-3"
               >
                  <div className="!text-xs flex items-center justify-between gap-2 p-2">
                     <span className="font-bold">Unique Owned</span>
                     <div className="flex items-center gap-0.5">
                        <span className="font-bold">{totalOwnedCards}</span>
                        <span className="text-zinc-500">/</span>
                        <span className="font-bold text-1">
                           {userCards.length}
                        </span>
                     </div>
                  </div>
                  <div className="!text-xs flex items-center justify-between gap-2 p-2">
                     <span className="font-bold">Pokémon</span>
                     <div className="flex items-center gap-0.5">
                        <span className="font-bold">
                           {cardTypeStats.pokemonOwned}
                        </span>
                        <span className="text-zinc-500">/</span>
                        <span className="font-bold text-1">
                           {cardTypeStats.pokemonTotal}
                        </span>
                     </div>
                  </div>
                  <div className="!text-xs flex items-center justify-between gap-2 p-2">
                     <span className="font-bold">Trainer</span>
                     <div className="flex items-center gap-0.5">
                        <span className="font-bold">
                           {cardTypeStats.trainerOwned}
                        </span>
                        <span className="text-zinc-500">/</span>
                        <span className="font-bold text-1">
                           {cardTypeStats.trainerTotal}
                        </span>
                     </div>
                  </div>
               </div>
               <SwitchField className="max-desktop:mb-3 mt-2.5 border border-blue-200 dark:bg-gray-700 dark:border-gray-600 rounded-lg pl-2.5 p-2 bg-blue-50 shadow-sm shadow-1">
                  <Label className="!text-xs font-bold flex items-center gap-1.5">
                     Expansion View
                     <Tooltip>
                        <TooltipTrigger>
                           <Icon name="info" size={14} className="text-1" />
                        </TooltipTrigger>
                        <TooltipContent>
                           In-game layout, grouped by expansion.
                        </TooltipContent>
                     </Tooltip>
                  </Label>
                  <Switch
                     color="blue"
                     checked={isSetView}
                     onChange={setIsSetView}
                  />
               </SwitchField>
            </div>
            <div className="flex-grow">
               <div className="grid grid-cols-4 tablet:grid-cols-10 gap-2 flex-grow w-full pb-2">
                  {Object.entries(cardsByType).map(([typeName, typeData]) => (
                     <div key={typeName} className="flex items-center gap-1">
                        <div
                           className="!text-xs flex items-center gap-1 rounded-md p-1 pr-1.5 bg-zinc-50 border border-zinc-200 
                           shadow-sm shadow-zinc-100 dark:border-zinc-600 dark:bg-dark450 dark:shadow-zinc-800  w-full justify-between"
                        >
                           <Image
                              className="size-4"
                              height={40}
                              width={40}
                              alt={typeName}
                              url={typeData.icon}
                           />
                           <div className="flex items-center flex-none gap-0.5">
                              <span className="font-bold">
                                 {typeData.owned}
                              </span>
                              <span className="text-zinc-500">/</span>
                              <span className="text-1">{typeData.total}</span>
                           </div>
                        </div>
                        <span className="sr-only">{typeName}</span>
                     </div>
                  ))}
               </div>
               <div className="grid grid-cols-2 tablet:grid-cols-5 gap-2 flex-grow w-full">
                  {Object.entries(cardsByRarity).map(
                     ([rarityName, rarityData]) => (
                        <Tooltip key={rarityName}>
                           <TooltipTrigger className="flex items-center w-full gap-1">
                              <div
                                 className="!text-xs flex items-center gap-0.5 rounded-md py-0.5 bg-zinc-50 border border-zinc-200 
                           shadow-sm shadow-zinc-100 dark:border-zinc-600 dark:bg-dark450 dark:shadow-zinc-800 px-1.5 min-w-12 w-full justify-between"
                              >
                                 <Image
                                    className="h-5 flex-none object-contain"
                                    height={40}
                                    alt={rarityName}
                                    url={rarityData.icon}
                                 />
                                 <div className="flex items-center flex-none gap-0.5">
                                    <span className="font-bold">
                                       {rarityData.owned}
                                    </span>
                                    <span className="text-zinc-500">/</span>
                                    <span className="text-1">
                                       {rarityData.total}
                                    </span>
                                 </div>
                              </div>
                           </TooltipTrigger>
                           <TooltipContent>{rarityName}</TooltipContent>
                        </Tooltip>
                     ),
                  )}
               </div>
            </div>
         </div>
         {/* @ts-ignore */}
         <ListTableContainer filters={cardCollectionFilters}>
            {isSetView ? (
               <SetView
                  cards={
                     userCards as Array<
                        Card & { user: string; count: number; isOwned: boolean }
                     >
                  }
               />
            ) : (
               <ExpansionView groupedCards={groupedCards} />
            )}
         </ListTableContainer>
      </div>
   );
}

function SetView({
   cards,
}: {
   cards: Array<Card & { user: string; count: number; isOwned: boolean }>;
}) {
   // Group cards by expansion and sort by setNum
   const groupedBySet = cards.reduce(
      (acc, card) => {
         const expansionName = card.expansion?.slug || "Unknown Expansion";

         if (!acc[expansionName]) {
            acc[expansionName] = {
               name: expansionName,
               logo: card.expansion?.logo?.url ?? "",
               cards: [],
            };
         }

         acc[expansionName]!.cards.push(card);
         return acc;
      },
      {} as Record<
         string,
         { name: string; logo?: string; cards: typeof cards }
      >,
   );

   // Sort cards within each expansion by setNum
   Object.values(groupedBySet).forEach((set) => {
      set.cards.sort((a, b) => {
         const aNum = parseInt(a.setNum?.toString() || "0");
         const bNum = parseInt(b.setNum?.toString() || "0");
         return aNum - bNum;
      });
   });

   return (
      <div className="space-y-4">
         {Object.entries(groupedBySet).map(([expansionName, set]) => (
            <Disclosure defaultOpen={true} key={expansionName}>
               {({ open }) => (
                  <>
                     <DisclosureButton
                        className="shadow-1 dark:border-zinc-600 broder-zinc-300 sticky top-[122px] z-20 bg-zinc-100 dark:bg-dark450 flex w-full 
                     items-center gap-3 overflow-hidden rounded-lg border p-1.5 px-2 mb-3 shadow-sm shadow-1"
                     >
                        {set.logo && (
                           <Image className="w-16" width={160} url={set.logo} />
                        )}
                        <div className="flex-grow text-left">
                           <div className="font-bold text-base font-header capitalize">
                              {set.name.replace(/-/g, " ")}
                           </div>
                           <Badge className="!text-xs flex items-center !gap-0.5">
                              <span className="font-bold">
                                 {
                                    set.cards.filter((card) => card.isOwned)
                                       .length
                                 }
                              </span>
                              <span className="text-zinc-500">/</span>
                              <span className="font-bold text-1">
                                 {set.cards.length}
                              </span>
                           </Badge>
                        </div>
                        <div
                           className="flex size-10 flex-none items-center justify-center rounded-full border border-zinc-200 bg-white 
                        shadow-sm shadow-zinc-200 dark:border-zinc-600 dark:bg-dark450 dark:shadow-zinc-800"
                        >
                           <Icon
                              name="chevron-down"
                              className={clsx(
                                 open ? "rotate-180" : "",
                                 "transform transition duration-300 ease-in-out",
                              )}
                              size={20}
                           />
                        </div>
                     </DisclosureButton>
                     <DisclosurePanel>
                        <ListTable
                           gridView={gridView}
                           columnViewability={{
                              pokemonType: false,
                              isEX: false,
                              cardType: false,
                              rarity: false,
                              isOwned: false,
                              expansion: false,
                           }}
                           gridCellClassNames="flex items-center justify-center"
                           gridContainerClassNames="grid-cols-3 tablet:grid-cols-5 grid gap-3"
                           defaultViewType="grid"
                           data={{
                              listData: {
                                 docs: set.cards,
                              },
                           }}
                           pageSize={set.cards.length}
                           columns={columns}
                           filters={cardCollectionFilters}
                           pager={false}
                           stickyFooter={true}
                        />
                     </DisclosurePanel>
                  </>
               )}
            </Disclosure>
         ))}
      </div>
   );
}

type ExpansionViewProps = {
   groupedCards: Record<
      string,
      {
         expansionName: string;
         expansionIcon?: string;
         expansionLogo?: string;
         packs: Record<
            string,
            {
               id: string;
               name: string;
               icon?: string;
               cards: Array<
                  Card & { user: string; count: number; isOwned: boolean }
               >;
               totalCards: number;
               ownedCards: number;
            }
         >;
         totalCards: number;
         ownedCards: number;
      }
   >;
};

function ExpansionView({ groupedCards }: ExpansionViewProps) {
   return Object.entries(groupedCards).map(([expansionName, expansionData]) => (
      <div className="mb-2.5" key={expansionName}>
         <Disclosure defaultOpen={true}>
            {({ open: expansionOpen }) => (
               <>
                  <DisclosureButton
                     className="shadow-1 dark:border-zinc-600 broder-zinc-300 sticky top-[122px] z-20 bg-zinc-100 dark:bg-dark450 flex w-full 
                     items-center gap-3 overflow-hidden rounded-lg border p-1.5 px-2 mb-3 shadow-sm shadow-1"
                  >
                     {expansionData.expansionLogo && (
                        <Image
                           className="w-16"
                           width={160}
                           url={expansionData.expansionLogo}
                        />
                     )}
                     <div className="flex-grow text-left">
                        <div className="font-bold text-base font-header capitalize">
                           {expansionData.expansionName.replace(/-/g, " ")}
                        </div>
                        <Badge className="!text-xs flex items-center !gap-0.5">
                           <span className="font-bold">
                              {expansionData.ownedCards}
                           </span>
                           <span className="text-zinc-500">/</span>
                           <span className="font-bold text-1">
                              {expansionData.totalCards}
                           </span>
                        </Badge>
                     </div>
                     <div
                        className="flex size-10 flex-none items-center justify-center rounded-full border border-zinc-200 bg-white 
                        shadow-sm shadow-zinc-200 dark:border-zinc-600 dark:bg-dark450 dark:shadow-zinc-800"
                     >
                        <Icon
                           name="chevron-down"
                           className={clsx(
                              expansionOpen ? "rotate-180" : "",
                              "transform transition duration-300 ease-in-out",
                           )}
                           size={20}
                        />
                     </div>
                  </DisclosureButton>
                  <DisclosurePanel>
                     {Object.entries(expansionData.packs).map(
                        ([packName, packData]) => (
                           <div
                              key={packName}
                              className="mb-3 pl-3 border-l-2 border-dotted border-zinc-300 dark:border-zinc-600"
                           >
                              <Disclosure defaultOpen={true}>
                                 {({ open: packOpen }) => (
                                    <>
                                       <DisclosureButton
                                          className="shadow-1 sticky top-[190px] z-10 border-color-sub bg-zinc-50 dark:bg-dark400 
                                       flex w-full items-center gap-2 overflow-hidden rounded-lg border p-1.5 px-2 pr-3 mb-3 shadow-sm shadow-1"
                                       >
                                          {packData.icon && (
                                             <Image
                                                className="h-12"
                                                height={160}
                                                url={packData.icon}
                                             />
                                          )}
                                          <div className="flex-grow text-left">
                                             <div className="font-bold text-sm font-header">
                                                {packName}
                                             </div>
                                             <Badge className="!text-xs flex items-center !gap-0.5">
                                                <span className="font-bold">
                                                   {packData.ownedCards}
                                                </span>
                                                <span className="text-zinc-500">
                                                   /
                                                </span>
                                                <span className="font-bold text-1">
                                                   {packData.totalCards}
                                                </span>
                                             </Badge>
                                          </div>
                                          <div
                                             className="flex size-8 flex-none items-center justify-center rounded-full border border-zinc-200 bg-white 
                                          shadow-sm shadow-zinc-200 dark:border-zinc-600 dark:bg-dark450 dark:shadow-zinc-800"
                                          >
                                             <Icon
                                                name="chevron-down"
                                                className={clsx(
                                                   packOpen ? "rotate-180" : "",
                                                   "transform transition duration-300 ease-in-out",
                                                )}
                                                size={16}
                                             />
                                          </div>
                                       </DisclosureButton>
                                       <DisclosurePanel
                                          contentEditable={false}
                                          unmount={false}
                                       >
                                          <ListTable
                                             gridView={gridView}
                                             columnViewability={{
                                                pokemonType: false,
                                                isEX: false,
                                                cardType: false,
                                                rarity: false,
                                                isOwned: false,
                                                expansion: false,
                                             }}
                                             gridCellClassNames="flex items-center justify-center"
                                             gridContainerClassNames="grid-cols-2 tablet:grid-cols-6 grid gap-3"
                                             defaultViewType="grid"
                                             data={{
                                                listData: {
                                                   docs: packData.cards,
                                                },
                                             }}
                                             columns={columns}
                                             filters={cardCollectionFilters}
                                             pager={packData.cards.length > 50}
                                             stickyFooter={true}
                                          />
                                       </DisclosurePanel>
                                    </>
                                 )}
                              </Disclosure>
                           </div>
                        ),
                     )}
                  </DisclosurePanel>
               </>
            )}
         </Disclosure>
      </div>
   ));
}

const columnHelper = createColumnHelper<
   Card & { user: string; count: number; isOwned: boolean }
>();

const gridView = columnHelper.accessor("name", {
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

      const isCardDeleting = isAdding(fetcher, "deleteUserCard");
      const isCardAdding = isAdding(fetcher, "addUserCard");
      const isCardUpdating = isAdding(fetcher, "updateUserCard");
      const isDisabled = isCardDeleting || isCardAdding || isCardUpdating;

      return (
         <div key={info.row.original?.id}>
            <Dialog
               className="relative flex items-center justify-center"
               size="tablet"
               onClose={setIsOpen}
               open={isOpen}
            >
               <DialogTitle className="sr-only">
                  {info.row.original?.name}
               </DialogTitle>
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
                     />
                  </ShinyCard>
                  <Button href={`/c/cards/${info.row.original?.slug}`}>
                     Go to card
                     <Icon name="chevron-right" size={16} />
                  </Button>
               </div>
            </Dialog>
            <div className="relative group/card">
               <div className="sr-only">{info.row.original?.name}</div>
               <div className="absolute bottom-0 left-0 w-full z-[5]">
                  <div className="flex items-center gap-1.5 w-full">
                     <div className="flex items-center justify-center gap-1 p-1.5 pr-1 w-full">
                        <div className="items-center justify-center gap-1.5 flex">
                           <button
                              disabled={isDisabled}
                              className={clsx(
                                 info.row.original?.count === 0
                                    ? "bg-zinc-500 border-transparent"
                                    : "border-red-700 hover:bg-red-600 hover:border-red-600 bg-red-500",
                                 "tablet:opacity-0 tablet:group-hover/card:opacity-100 shadow shadow-1 border rounded-full size-8 tablet:size-10  flex items-center justify-center group ",
                              )}
                              onClick={() => {
                                 if (info.row.original?.count === 0) return;
                                 fetcher.submit(
                                    {
                                       cardId: info.row.original?.id,
                                       cardCount: info.row.original?.count,
                                       cardUserId: info.row.original?.user,
                                       intent: "deleteUserCard",
                                    },
                                    {
                                       method: "DELETE",
                                    },
                                 );
                              }}
                           >
                              {isCardDeleting ? (
                                 <Icon
                                    name="loader-2"
                                    size={20}
                                    className="animate-spin text-white"
                                 />
                              ) : (
                                 <Icon
                                    title="Remove card"
                                    className="text-white"
                                    name="minus"
                                    size={20}
                                 />
                              )}
                           </button>
                           <span
                              className={clsx(
                                 info.row.original?.count === 0
                                    ? "tablet:opacity-0"
                                    : "tablet:opacity-100",
                                 "shadow shadow-1 group-hover/card:opacity-100 rounded-md bg-zinc-800 text-white size-8 tablet:size-9 flex items-center justify-center text-sm font-mono font-bold",
                              )}
                           >
                              {info.row.original?.count}
                           </span>
                           <button
                              disabled={isDisabled}
                              className="tablet:opacity-0 tablet:group-hover/card:opacity-100 shadow shadow-1 border border-green-600 hover:bg-green-600 rounded-full 
                              size-8 tablet:size-10 bg-green-500 flex items-center justify-center group hover:border-green-600"
                              onClick={() => {
                                 fetcher.submit(
                                    {
                                       cardId: info.row.original?.id,
                                       cardCount: info.row.original?.count,
                                       cardUserId: info.row.original?.user,
                                       intent: "updateUserCard",
                                    },
                                    {
                                       method: "PATCH",
                                    },
                                 );
                              }}
                           >
                              {isCardUpdating ? (
                                 <Icon
                                    name="loader-2"
                                    size={20}
                                    className="animate-spin text-white"
                                 />
                              ) : (
                                 <Icon
                                    title="Update card"
                                    name="plus"
                                    className="text-white"
                                    size={20}
                                 />
                              )}
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
               <button
                  className="flex items-center justify-center"
                  onClick={() => setIsOpen(true)}
               >
                  <Image
                     className={clsx(
                        "object-contain",
                        info.row.original?.isOwned
                           ? "opacity-100"
                           : "opacity-50",
                     )}
                     width={367}
                     height={512}
                     url={
                        info.row.original?.icon?.url ??
                        "https://static.mana.wiki/tcgwiki-pokemonpocket/CardIcon_Card_Back.png"
                     }
                     alt={info.row.original?.name ?? "Card Image"}
                  />
               </button>
            </div>
         </div>
      );
   },
});

const columns = [
   columnHelper.accessor("name", {
      header: "Card",
      filterFn: fuzzyFilter,
      cell: (info) => {
         const fetcher = useFetcher();

         const isCardDeleting = isAdding(fetcher, "deleteUserCard");
         const isCardAdding = isAdding(fetcher, "addUserCard");
         const isCardUpdating = isAdding(fetcher, "updateUserCard");
         const isDisabled = isCardDeleting || isCardAdding || isCardUpdating;
         return (
            <div className="flex items-center justify-between gap-1">
               <Link
                  to={`/c/cards/${info.row.original.slug}`}
                  className="flex items-center gap-3 group py-0.5"
               >
                  <Image
                     className="w-9 object-contain"
                     width={100}
                     url={
                        info.row.original.icon?.url ??
                        "https://static.mana.wiki/tcgwiki-pokemonpocket/CardIcon_Card_Back.png"
                     }
                  />
                  <span
                     className="space-y-1.5 font-semibold group-hover:underline
                decoration-zinc-400 underline-offset-2 truncate"
                  >
                     <div className="truncate">{info.getValue()}</div>
                     <div className="flex items-center gap-1">
                        <Image
                           className="h-4"
                           height={40}
                           url={info.row.original.rarity?.icon?.url}
                        />
                     </div>
                  </span>
               </Link>
               <div className="items-center gap-1.5 max-tablet:flex flex">
                  {info.row.original?.count !== 0 && (
                     <button
                        disabled={isDisabled}
                        className="shadow shadow-1 border border-red-700 hover:bg-red-600 rounded-full size-7 bg-red-500 flex items-center justify-center group hover:border-red-600"
                        onClick={() => {
                           fetcher.submit(
                              {
                                 cardId: info.row.original?.id,
                                 cardCount: info.row.original?.count,
                                 cardUserId: info.row.original?.user,
                                 intent: "deleteUserCard",
                              },
                              {
                                 method: "DELETE",
                              },
                           );
                        }}
                     >
                        {isCardDeleting ? (
                           <Icon
                              name="loader-2"
                              size={14}
                              className="animate-spin text-white"
                           />
                        ) : (
                           <Icon
                              title="Remove card"
                              className="text-white"
                              name="minus"
                              size={14}
                           />
                        )}
                     </button>
                  )}
                  <span className="shadow shadow-1 rounded-md bg-zinc-800 text-white size-7 flex items-center justify-center text-sm font-mono font-bold">
                     {info.row.original?.count}
                  </span>
                  <button
                     disabled={isDisabled}
                     className="shadow shadow-1 border border-green-600 hover:bg-green-600 rounded-full size-7 bg-green-500 flex items-center justify-center group hover:border-green-600"
                     onClick={() => {
                        fetcher.submit(
                           {
                              cardId: info.row.original?.id,
                              cardCount: info.row.original?.count,
                              cardUserId: info.row.original?.user,
                              intent: "updateUserCard",
                           },
                           {
                              method: "PATCH",
                           },
                        );
                     }}
                  >
                     {isCardUpdating ? (
                        <Icon
                           name="loader-2"
                           size={14}
                           className="animate-spin text-white"
                        />
                     ) : (
                        <Icon
                           title="Update card"
                           name="plus"
                           className="text-white"
                           size={14}
                        />
                     )}
                  </button>
               </div>
            </div>
         );
      },
   }),
   columnHelper.accessor("pokemonType", {
      header: "Type",
      filterFn: (row, columnId, filterValue) => {
         return filterValue.includes(row?.original?.pokemonType?.name);
      },
   }),
   columnHelper.accessor("rarity", {
      header: "Rarity",
      filterFn: (row, columnId, filterValue) => {
         return filterValue.includes(row?.original?.rarity?.name);
      },
   }),
   columnHelper.accessor("isOwned", {
      header: "Owned",
      filterFn: (row, columnId, filterValue) => {
         return filterValue.includes(row?.original?.isOwned.toString());
      },
   }),
   columnHelper.accessor("expansion", {
      header: "Set",
      filterFn: (row, columnId, filterValue) => {
         return filterValue.includes(row?.original?.expansion?.id);
      },
   }),
   columnHelper.accessor("isEX", {
      filterFn: (row, columnId, filterValue) => {
         return filterValue.includes(row?.original?.isEX?.toString());
      },
   }),
   columnHelper.accessor("cardType", {
      filterFn: (row, columnId, filterValue) => {
         return filterValue.includes(row?.original?.cardType?.toString());
      },
   }),
];

export const UserCardSchema = z.object({
   name: z.string(),
   collectionId: z.string(),
   siteId: z.string(),
});

export const action: ActionFunction = async ({
   context: { payload, user },
   request,
}) => {
   if (!user || !user.id) return redirect("/login", { status: 302 });

   const { intent } = await zx.parseForm(request, {
      intent: z.enum(["updateUserCard", "deleteUserCard"]),
   });

   switch (intent) {
      case "updateUserCard": {
         try {
            const { cardId, cardCount, cardUserId } = await zx.parseForm(
               request,
               {
                  cardId: z.string(),
                  cardCount: z.coerce.number(),
                  cardUserId: z.string(),
               },
            );
            if (cardCount === 0) {
               const userCardQuery = qs.stringify(
                  {
                     where: {
                        card: {
                           equals: cardId,
                        },
                        user: {
                           equals: user.id,
                        },
                     },
                     depth: 0,
                  },
                  { addQueryPrefix: true },
               );

               // Check if user card already exists
               const existingUserCard = await authRestFetcher({
                  isAuthOverride: true,
                  method: "GET",
                  path: `https://pokemonpocket.tcg.wiki:4000/api/user-cards${userCardQuery}`,
               });

               if (existingUserCard?.docs?.length > 0) {
                  // Update existing card instead of creating new one
                  const updatedUserCard = await authRestFetcher({
                     isAuthOverride: true,
                     method: "PATCH",
                     path: `https://pokemonpocket.tcg.wiki:4000/api/user-cards/${existingUserCard.docs[0].id}`,
                     body: {
                        count: existingUserCard.docs[0].count + 1,
                     },
                  });
                  if (updatedUserCard) {
                     return jsonWithSuccess(
                        null,
                        `${updatedUserCard.doc.card.name} updated`,
                     );
                  }
               }

               // Create new user card if none exists
               const addUserCard = await authRestFetcher({
                  isAuthOverride: true,
                  method: "POST",
                  path: `https://pokemonpocket.tcg.wiki:4000/api/user-cards`,
                  body: {
                     card: cardId,
                     count: 1,
                     user: user.id,
                  },
               });
               if (addUserCard) {
                  return jsonWithSuccess(
                     null,
                     `${addUserCard.doc.card.name} added`,
                  );
               }
            }
            //Users can only mutate their own cards
            if (user.id === cardUserId) {
               const updatedUserCard = await authRestFetcher({
                  isAuthOverride: true,
                  method: "PATCH",
                  path: `https://pokemonpocket.tcg.wiki:4000/api/user-cards/${cardId}`,
                  body: {
                     count: cardCount + 1,
                  },
               });
               if (updatedUserCard) {
                  return jsonWithSuccess(
                     null,
                     `${updatedUserCard.doc.card.name} updated`,
                  );
               }
            }

            return jsonWithError(
               null,
               "Something went wrong...unable to update card",
            );
         } catch (error) {
            return jsonWithError(
               null,
               "Something went wrong...unable to update card",
            );
         }
      }
      case "deleteUserCard": {
         try {
            const { cardId, cardCount, cardUserId } = await zx.parseForm(
               request,
               {
                  cardId: z.string(),
                  cardCount: z.coerce.number(),
                  cardUserId: z.string(),
               },
            );

            //Users can only mutate their own cards
            if (user.id === cardUserId) {
               if (cardCount === 1) {
                  const deletedUserCard = await authRestFetcher({
                     isAuthOverride: true,
                     method: "DELETE",
                     path: `https://pokemonpocket.tcg.wiki:4000/api/user-cards/${cardId}`,
                  });
                  if (deletedUserCard) {
                     return jsonWithSuccess(
                        null,
                        `${deletedUserCard.card.name} deleted`,
                     );
                  }
               }
               if (cardCount > 1) {
                  const updatedUserCard = await authRestFetcher({
                     isAuthOverride: true,
                     method: "PATCH",
                     path: `https://pokemonpocket.tcg.wiki:4000/api/user-cards/${cardId}`,
                     body: {
                        count: cardCount - 1,
                     },
                  });
                  if (updatedUserCard) {
                     return jsonWithSuccess(
                        null,
                        `${updatedUserCard.doc.card.name} updated`,
                     );
                  }
               }
            }
            return jsonWithError(
               null,
               `Something went wrong...unable to delete card`,
            );
         } catch (error) {
            payload.logger.error(`${error}`);
            return jsonWithError(
               null,
               "Something went wrong...unable to delete card",
            );
         }
      }
   }
};

const cardCollectionFilters: {
   id: string;
   label: string;
   cols?: 1 | 2 | 3 | 4 | 5;
   options: { label?: string; value: string; icon?: string }[];
}[] = [
   {
      id: "isOwned",
      label: "Owned",
      cols: 2,
      options: [
         { label: "Show owned", value: "true" },
         { label: "Show unowned", value: "false" },
      ],
   },
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
      id: "rarity",
      label: "Rarity",
      cols: 3,
      options: [
         {
            value: "UR",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/RarityIcon_UR.png",
         },
         {
            value: "IM",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/RarityIcon_IM.png",
         },
         {
            value: "SAR",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/RarityIcon_SAR.png",
         },
         {
            value: "SR",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/RarityIcon_SR.png",
         },
         {
            value: "AR",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/RarityIcon_AR.png",
         },
         {
            value: "RR",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/RarityIcon_RR.png",
         },
         {
            value: "R",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/RarityIcon_R.png",
         },
         {
            value: "U",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/RarityIcon_U.png",
         },
         {
            value: "C",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/RarityIcon_C.png",
         },
      ],
   },
];

const QUERY = gql`
   query ($userId: String!) {
      allCards: Cards(limit: 5000, sort: "-rarity") {
         docs {
            id
            name
            slug
            isEX
            hp
            setNum
            packs {
               id
               name
               icon {
                  url
               }
            }
            expansion {
               id
               slug
               icon {
                  url
               }
               logo {
                  url
               }
            }
            cardType
            icon {
               url
            }
            pokemonType {
               name
               icon {
                  url
               }
            }
            weaknessType {
               name
               icon {
                  url
               }
            }
            rarity {
               name
               icon {
                  url
               }
            }
         }
      }
      cards: UserCards(where: { user: { equals: $userId } }, limit: 1000) {
         totalDocs
         docs {
            id
            count
            user
            card {
               id
               name
               slug
               isEX
               hp
               setNum
               packs {
                  id
                  name
                  icon {
                     url
                  }
               }
               expansion {
                  id
                  slug
                  icon {
                     url
                  }
                  logo {
                     url
                  }
               }
               cardType
               icon {
                  url
               }
               pokemonType {
                  name
                  icon {
                     url
                  }
               }
               weaknessType {
                  name
                  icon {
                     url
                  }
               }
               rarity {
                  name
                  icon {
                     url
                  }
               }
            }
         }
      }
   }
`;
