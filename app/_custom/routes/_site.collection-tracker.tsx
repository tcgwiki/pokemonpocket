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

import { CustomPageHeader } from "~/components/CustomPageHeader";
import { Image } from "~/components/Image";

import type { Card, User } from "payload/generated-custom-types";
import { fuzzyFilter } from "~/routes/_site+/c_+/_components/fuzzyFilter";
import { ListTable } from "~/routes/_site+/c_+/_components/ListTable";
import { authRestFetcher, gqlFetch } from "~/utils/fetchers.server";
import { useMemo, useState } from "react";
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

         // For owned cards, sort by count (descending)
         if (a.isOwned && b.isOwned) {
            return b.count - a.count;
         }

         // For unowned cards, maintain original order
         return 0;
      });
   return json({ userCards: cardsList, user });
}

export const meta: MetaFunction = () => {
   return [
      {
         title: "Collection Tracker | Pokémon TCG Pocket - TCG Wiki",
      },
   ];
};

export default function CollectionTracker() {
   const { userCards, user } = useLoaderData<typeof loader>();

   return (
      <div className="relative z-20 mx-auto max-w-[1200px] justify-center px-3 pb-4">
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
            gridContainerClassNames="grid-cols-3 tablet:grid-cols-6 grid gap-3"
            defaultViewType="grid"
            data={{ listData: { docs: userCards } }}
            columns={columns}
            filters={cardCollectionFilters}
            pager={userCards.length > 50 ? true : false}
            stickyFooter={true}
         />
      </div>
   );
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
               <div className="absolute bottom-0 left-0 w-full z-10">
                  <div className="flex items-center gap-1.5 w-full">
                     <div className="flex items-center justify-between gap-1 p-1.5 pr-1 w-full">
                        <span className="shadow shadow-1 rounded-md bg-zinc-800 text-white size-7 flex items-center justify-center text-sm font-mono font-bold">
                           {info.row.original?.count}
                        </span>
                        <div className="items-center gap-1.5 max-tablet:flex tablet:hidden group-hover/card:flex">
                           {info.row.original?.count !== 0 && (
                              <button
                                 disabled={isDisabled}
                                 className="shadow shadow-1 hover:bg-zinc-600 rounded-full size-7 bg-zinc-500 flex items-center justify-center group"
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
         </>
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
               const addUserCard = await authRestFetcher({
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
      id: "expansion",
      label: "Expansion",
      cols: 1,
      options: [
         {
            value: "A1",
            label: "Genetic Apex",
         },
      ],
   },
   {
      id: "isOwned",
      label: "Owned",
      options: [{ label: "Show owned only", value: "true" }],
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
            expansion {
               id
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
      cards: UserCards(where: { user: { equals: $userId } }) {
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
               expansion {
                  id
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
