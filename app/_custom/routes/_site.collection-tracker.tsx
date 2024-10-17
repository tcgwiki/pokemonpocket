import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, Link, useLoaderData } from "@remix-run/react";
import { createColumnHelper } from "@tanstack/react-table";
import clsx from "clsx";
import { gql } from "graphql-request";

import { CustomPageHeader } from "~/components/CustomPageHeader";
import { Image } from "~/components/Image";

import type { Deck } from "payload/generated-custom-types";
import { AdUnit } from "~/routes/_site+/_components/RampUnit";
import { fuzzyFilter } from "~/routes/_site+/c_+/_components/fuzzyFilter";
import { ListTable } from "~/routes/_site+/c_+/_components/ListTable";
import ListTableContainer from "~/routes/_site+/c_+/_components/ListTableContainer";
import { gqlFetch } from "~/utils/fetchers.server";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/Tooltip";

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
   const data = useLoaderData<typeof loader>();

   return (
      <>
         <CustomPageHeader
            name="Collection Tracker"
            iconUrl="https://static.mana.wiki/servant-tier-list-icon.png"
         />
         <div className="relative z-20 mx-auto max-w-[728px] justify-center max-tablet:px-3 tablet:pb-36">
            asd
         </div>
      </>
   );
}

const columnHelper = createColumnHelper<Deck>();

const gridView = columnHelper.accessor("name", {
   filterFn: fuzzyFilter,
   cell: (info) => {
      return (
         <Link
            to={`/c/decks/${info.row.original.slug}`}
            className="flex gap-3 flex-col justify-center"
            key={info.row.original.id}
         >
            <div className="inline-flex mx-auto -space-x-8">
               {info.row.original?.highlightCards?.map((card) => (
                  <Tooltip placement="bottom">
                     <TooltipTrigger
                        className="shadow-sm shadow-1 z-10"
                        key={card.id}
                     >
                        <Image
                           url={card.icon?.url}
                           alt={card.name ?? ""}
                           className="w-14 object-contain"
                           width={200}
                           height={280}
                        />
                     </TooltipTrigger>
                     <TooltipContent className="!p-0 !bg-transparent !border-0 !z-50">
                        <Image
                           url={card.icon?.url}
                           alt={card.name ?? ""}
                           width={367}
                           height={512}
                           className="w-full object-contain"
                        />
                     </TooltipContent>
                  </Tooltip>
               ))}
            </div>
            <div className="text-center text-sm font-bold border-t pt-1 dark:border-zinc-600 space-y-1">
               {info.row.original.deckTypes && (
                  <div
                     className={clsx(
                        "flex gap-1 justify-center",
                        info.row.original.deckTypes.length > 0 && "-mt-3",
                     )}
                  >
                     {info.row.original.deckTypes?.map((type) => (
                        <Image
                           width={32}
                           height={32}
                           url={type.icon?.url}
                           alt={info.row.original.name ?? ""}
                           className="size-4 object-contain"
                        />
                     ))}
                  </div>
               )}
               <div>{info.getValue()}</div>
            </div>
         </Link>
      );
   },
});

const columns = [
   columnHelper.accessor("name", {
      header: "Name",
      cell: (info) => (
         <div className="flex items-center gap-2 group py-0.5">
            <Image
               width={132}
               height={144}
               className="w-7 flex-none"
               loading="lazy"
               url={info.row.original.icon?.url}
            />
            <span className="font-bold group-hover:underline decoration-zinc-400 underline-offset-2">
               <span>{info.getValue()}</span>
            </span>
         </div>
      ),
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
      sTier: Decks(where: { tier: { equals: s } }, limit: 100, sort: "name") {
         totalDocs
         docs {
            id
            slug
            name
         }
      }
   }
`;
