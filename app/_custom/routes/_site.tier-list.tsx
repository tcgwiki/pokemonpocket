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
         title: "Deck Tier List | Pokémon TCG Pocket - TCG Wiki",
      },
   ];
};

export default function TierList() {
   const data = useLoaderData<typeof loader>();

   const gridContainerClassNames = "grid grid-cols-4 gap-3 p-3 w-full";

   return (
      <>
         <CustomPageHeader
            name="Deck Tier List"
            iconUrl="https://static.mana.wiki/servant-tier-list-icon.png"
         />
         <div className="relative z-20 mx-auto max-w-[728px] justify-center max-tablet:px-3 tablet:pb-36">
            <div className="relative z-20 mx-auto max-w-[728px] justify-center">
               <AdUnit
                  enableAds={true}
                  adType={{
                     desktop: "leaderboard_atf",
                     tablet: "leaderboard_atf",
                     mobile: "med_rect_atf",
                  }}
                  className="my-4 mx-auto flex items-center justify-center"
                  selectorId="tier-list-1"
               />
            </div>
            <ListTableContainer
               className="border border-color-sub rounded-lg divide-y divide-color-sub overflow-hidden mb-4"
               // filters={filters}
            >
               <div className="flex items-stretch max-tablet:flex-col max-tablet:divide-y tablet:divide-x divide-color-sub">
                  <div className="p-3 w-full tablet:w-24 mx-auto flex tablet:items-start tablet:justify-center bg-2-sub">
                     <div
                        className="bg-red-100 shadow-sm shadow-1 border border-red-300 
                        dark:bg-red-950 text-sm px-2  tablet:w-24 dark:border-red-900 text-red-600
                        rounded-lg p-1 flex items-center justify-center font-bold dark:text-red-500"
                     >
                        S Tier
                     </div>
                  </div>
                  <ListTable
                     pager={false}
                     gridView={gridView}
                     searchPlaceholder="Filter by Servant name..."
                     defaultViewType="grid"
                     data={{
                        listData: {
                           docs: (data as { sTier: { docs: Deck[] } }).sTier
                              .docs,
                        },
                     }}
                     columns={columns}
                     columnViewability={{ tier: false }}
                     gridCellClassNames="border border-color-sub rounded-lg pt-3 dark:bg-dark400 pb-2 shadow-sm shadow-1 bg-zinc-50"
                     gridContainerClassNames={gridContainerClassNames}
                  />
               </div>
               <div className="flex items-stretch max-tablet:flex-col max-tablet:divide-y tablet:divide-x divide-color-sub">
                  <div className="p-3 w-full tablet:w-24 mx-auto flex tablet:items-start tablet:justify-center bg-2-sub">
                     <div
                        className="bg-yellow-100 shadow-sm shadow-1 border border-yellow-300 
                        dark:bg-yellow-950 text-sm px-2  tablet:w-24 dark:border-yellow-900 text-yellow-600
                        rounded-lg p-1 flex items-center justify-center font-bold dark:text-yellow-500"
                     >
                        A Tier
                     </div>
                  </div>
                  <ListTable
                     pager={false}
                     gridView={gridView}
                     searchPlaceholder="Filter by Servant name..."
                     defaultViewType="grid"
                     data={{
                        listData: {
                           docs: (data as { aTier: { docs: Deck[] } }).aTier
                              .docs,
                        },
                     }}
                     columns={columns}
                     columnViewability={{ tier: false }}
                     gridCellClassNames=" "
                     gridContainerClassNames={gridContainerClassNames}
                  />
               </div>
               <div className="flex items-stretch max-tablet:flex-col max-tablet:divide-y tablet:divide-x divide-color-sub">
                  <div className="p-3 w-full tablet:w-24 mx-auto flex tablet:items-start tablet:justify-center bg-2-sub">
                     <div
                        className="bg-green-100 shadow-sm shadow-1 border border-green-300 
                        dark:bg-green-950 text-sm px-2  tablet:w-24 dark:border-green-900 text-green-600
                        rounded-lg p-1 flex items-center justify-center font-bold dark:text-green-500"
                     >
                        B Tier
                     </div>
                  </div>
                  <ListTable
                     pager={false}
                     gridView={gridView}
                     searchPlaceholder="Filter by Servant name..."
                     defaultViewType="grid"
                     data={{
                        listData: {
                           docs: (data as { bTier: { docs: Deck[] } }).bTier
                              .docs,
                        },
                     }}
                     columns={columns}
                     columnViewability={{ tier: false }}
                     gridCellClassNames=" "
                     gridContainerClassNames={gridContainerClassNames}
                  />
               </div>
               <div className="flex items-stretch max-tablet:flex-col max-tablet:divide-y tablet:divide-x divide-color-sub">
                  <div className="p-3 w-full tablet:w-24 mx-auto flex tablet:items-start tablet:justify-center bg-2-sub">
                     <div
                        className="bg-blue-100 shadow-sm shadow-1 border border-blue-300 
                        dark:bg-blue-950 text-sm px-2  tablet:w-24 dark:border-blue-900 text-blue-600
                        rounded-lg p-1 flex items-center justify-center font-bold dark:text-blue-500"
                     >
                        C Tier
                     </div>
                  </div>
                  <ListTable
                     pager={false}
                     gridView={gridView}
                     searchPlaceholder="Filter by Deck name..."
                     defaultViewType="grid"
                     data={{
                        listData: {
                           docs: (data as { cTier: { docs: Deck[] } }).cTier
                              .docs,
                        },
                     }}
                     columns={columns}
                     columnViewability={{ tier: false }}
                     gridCellClassNames=" "
                     gridContainerClassNames={gridContainerClassNames}
                  />
               </div>
            </ListTableContainer>
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
                           className="w-12 object-contain"
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
         <Link
            to={`/c/decks/${info.row.original.slug}`}
            className="flex items-center gap-2 group py-0.5"
         >
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
         </Link>
      ),
   }),
];

const QUERY = gql`
   query {
      sTier: Decks(where: { tier: { equals: s } }, limit: 100, sort: "name") {
         totalDocs
         docs {
            id
            slug
            name
            tier
            icon {
               id
               url
            }
            highlightCards {
               id
               name
               icon {
                  url
               }
            }
            deckTypes {
               id
               name
               icon {
                  url
               }
            }
         }
      }
      aTier: Decks(where: { tier: { equals: a } }, limit: 100, sort: "name") {
         totalDocs
         docs {
            id
            slug
            name
            tier
            icon {
               id
               url
            }
            highlightCards {
               id
               name
               icon {
                  url
               }
            }
            deckTypes {
               id
               name
               icon {
                  url
               }
            }
         }
      }
      bTier: Decks(where: { tier: { equals: b } }, limit: 100, sort: "name") {
         totalDocs
         docs {
            id
            slug
            name
            tier
            icon {
               id
               url
            }
            highlightCards {
               id
               name
               icon {
                  url
               }
            }
            deckTypes {
               id
               name
               icon {
                  url
               }
            }
         }
      }
      cTier: Decks(where: { tier: { equals: c } }, limit: 100, sort: "name") {
         totalDocs
         docs {
            id
            slug
            name
            tier
            icon {
               id
               url
            }
            highlightCards {
               id
               name
               icon {
                  url
               }
            }
            deckTypes {
               id
               name
               icon {
                  url
               }
            }
         }
      }
   }
`;
