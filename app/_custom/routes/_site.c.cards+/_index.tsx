import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { createColumnHelper } from "@tanstack/react-table";
import { gql } from "graphql-request";

import { Image } from "~/components/Image";
import { Tooltip, TooltipTrigger, TooltipContent } from "~/components/Tooltip";
import { Card } from "~/db/payload-custom-types";
import { fetchList } from "~/routes/_site+/c_+/$collectionId/utils/fetchList.server";
import { listMeta } from "~/routes/_site+/c_+/$collectionId/utils/listMeta";
import { fuzzyFilter } from "~/routes/_site+/c_+/_components/fuzzyFilter";
import { List } from "~/routes/_site+/c_+/_components/List";

export { listMeta as meta };

export async function loader({
   context: { payload, user },
   params,
   request,
}: LoaderFunctionArgs) {
   const list = await fetchList({
      isAuthOverride: true,
      params,
      request,
      payload,
      user,
      gql: {
         query: CARDS,
      },
   });
   return json({ list });
}

export default function ListPage() {
   return (
      <List
         columnViewability={{
            pokemonType: false,
            isEX: false,
            cardType: false,
         }}
         gridView={cardGridView}
         defaultViewType="grid"
         columns={cardColumns}
         //@ts-ignore
         filters={cardFilters}
      />
   );
}

const columnHelper = createColumnHelper<Card>();

export const cardGridView = columnHelper.accessor("name", {
   filterFn: fuzzyFilter,
   cell: (info) => (
      <Link
         className="block relative"
         to={`/c/cards/${info.row.original.slug}`}
      >
         <div className="text-xs font-semibold pb-2 truncate">
            {info.getValue()}
         </div>
         <Image
            loading="lazy"
            className="object-contain"
            width={367}
            height={512}
            alt={info.row.original.name ?? ""}
            url={
               info.row.original.icon?.url ??
               "https://static.mana.wiki/tcgwiki-pokemonpocket/CardIcon_Card_Back.png"
            }
         />
         <div className="flex items-center gap-2 justify-between pt-1.5">
            <Image
               className="object-contain h-5"
               height={24}
               url={info.row.original.rarity?.icon?.url}
            />
            {info.row.original.pokemonType?.icon?.url ? (
               <Image
                  loading="lazy"
                  className="size-4 object-contain"
                  width={40}
                  height={40}
                  url={info.row.original.pokemonType?.icon?.url}
                  alt={info.row.original.pokemonType?.name ?? ""}
               />
            ) : undefined}
         </div>
      </Link>
   ),
});

export const cardColumns = [
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
                  loading="lazy"
                  className="w-9 object-contain"
                  height={140}
                  width={100}
                  url={
                     info.row.original.icon?.url ??
                     "https://static.mana.wiki/tcgwiki-pokemonpocket/CardIcon_Card_Back.png"
                  }
                  alt={info.row.original.name ?? ""}
               />
               <span
                  className="space-y-1.5 font-semibold group-hover:underline
                decoration-zinc-400 underline-offset-2 truncate"
               >
                  <div className="truncate">{info.getValue()}</div>
                  {info.row.original.pokemonType?.icon?.url ? (
                     <Image
                        loading="lazy"
                        className="size-4 object-contain"
                        width={40}
                        height={40}
                        url={info.row.original.pokemonType?.icon?.url}
                        alt={info.row.original.pokemonType?.name ?? ""}
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
               loading="lazy"
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
               loading="lazy"
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
   columnHelper.accessor("expansion", {
      header: "Expansion",
      cell: (info) => {
         return info.getValue() ? info.getValue() : "-";
      },
      filterFn: (row, columnId, filterValue) => {
         return filterValue.includes(row?.original?.expansion?.id);
      },
   }),
];

const CARDS = gql`
   query {
      listData: Cards(limit: 5000, sort: "-rarity") {
         totalDocs
         docs {
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
            expansion {
               id
               name
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
`;

export const cardFilters: {
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
            label: "Space-Time Smackdown",
            value: "A2",
         },
         {
            label: "Mythical Island",
            value: "A1a",
         },
         {
            label: "Genetic Apex",
            value: "A1",
         },
         {
            label: "PROMO-A",
            value: "PROMO-A",
         },
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
