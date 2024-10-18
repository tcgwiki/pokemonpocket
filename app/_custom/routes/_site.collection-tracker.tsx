import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, Link, useLoaderData } from "@remix-run/react";
import { createColumnHelper } from "@tanstack/react-table";
import { gql } from "graphql-request";

import { CustomPageHeader } from "~/components/CustomPageHeader";
import { Image } from "~/components/Image";

import type { Card } from "payload/generated-custom-types";
import { fuzzyFilter } from "~/routes/_site+/c_+/_components/fuzzyFilter";
import { ListTable } from "~/routes/_site+/c_+/_components/ListTable";
import { gqlFetch } from "~/utils/fetchers.server";
import { useState } from "react";
import { cardRarityEnum } from "./_site.c.cards+/components/Cards.Main";
import { Dialog } from "~/components/Dialog";
import { Button } from "~/components/Button";
import { ShinyCard } from "./_site.c.cards+/components/ShinyCard";
import { Icon } from "~/components/Icon";

export async function loader({ request }: LoaderFunctionArgs) {
   const deckTierList = await gqlFetch({
      isCustomDB: true,
      isCached: true,
      query: QUERY,
      request,
   });
   return json(deckTierList);
}

export const meta: MetaFunction = () => {
   return [
      {
         title: "Collection Tracker | Pokémon TCG Pocket - TCG Wiki",
      },
   ];
};

export default function CollectionTracker() {
   const data = useLoaderData<typeof loader>() as {
      cards: { docs: Array<{ card: Card; count: number }>; totalDocs: number };
   };

   const cardsList = data.cards.docs.flatMap((item) => ({
      ...item.card,
      count: item.count,
   }));

   return (
      <>
         <CustomPageHeader
            name="My Collection"
            iconUrl="https://static.mana.wiki/servant-tier-list-icon.png"
         />
         <div className="relative z-20 mx-auto max-w-[1200px] justify-center px-3">
            <ListTable
               gridView={gridView}
               columnViewability={{
                  pokemonType: false,
                  isEX: false,
                  cardType: false,
               }}
               gridCellClassNames=" "
               gridContainerClassNames="grid-cols-8 grid gap-3"
               defaultViewType="grid"
               defaultSort={[{ id: "updatedAt", desc: true }]}
               data={{ listData: { docs: cardsList } }}
               columns={columns}
               filters={cardCollectionFilters}
               pager={data.cards.totalDocs > 50 ? true : false}
            />
         </div>
      </>
   );
}

const columnHelper = createColumnHelper<Card & { count: number }>();

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
         return (
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
                  {info.row.original.pokemonType?.icon?.url ? (
                     <Image
                        className="size-4 object-contain"
                        width={40}
                        height={40}
                        url={info.row.original.pokemonType?.icon?.url}
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
   columnHelper.accessor("rarity", {
      header: "Rarity",
      filterFn: (row, columnId, filterValue) => {
         return filterValue.includes(row?.original?.rarity?.name);
      },
      cell: (info) => {
         return info.getValue()?.icon?.url ? (
            <Image
               className="h-6"
               height={40}
               url={info.getValue()?.icon?.url}
            />
         ) : (
            "-"
         );
      },
   }),
   columnHelper.accessor("weaknessType", {
      header: "Weakness",
      filterFn: (row, columnId, filterValue) => {
         return filterValue.includes(row?.original?.weaknessType?.name);
      },
      cell: (info) => {
         return info.getValue()?.icon?.url ? (
            <Image
               className="size-4"
               width={40}
               height={40}
               url={info.getValue()?.icon?.url}
            />
         ) : (
            "-"
         );
      },
   }),

   columnHelper.accessor("retreatCost", {
      header: "Retreat",
      filterFn: (row, columnId, filterValue) => {
         return filterValue.includes(row?.original?.retreatCost);
      },
      cell: (info) => {
         return info.getValue() ? info.getValue() : "-";
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
   columnHelper.accessor("hp", {
      header: "HP",
      cell: (info) => {
         return info.getValue() ? info.getValue() : "-";
      },
   }),
];

const cardCollectionFilters: {
   id: string;
   label: string;
   cols?: 1 | 2 | 3 | 4 | 5;
   options: { label?: string; value: string; icon?: string }[];
}[] = [
   {
      id: "types",
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
      id: "cost",
      label: "Cost",
      cols: 3,
      options: [
         { label: "Low", value: "Low" },
         { label: "Medium", value: "Medium" },
         { label: "High", value: "High" },
      ],
   },
];

const QUERY = gql`
   query {
      cards: UserCards {
         totalDocs
         docs {
            id
            updatedAt
            count
            card {
               id
               name
               slug
               isEX
               retreatCost
               hp
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
