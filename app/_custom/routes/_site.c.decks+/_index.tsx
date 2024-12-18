import type { ActionFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, useFetcher, useLoaderData } from "@remix-run/react";
import { createColumnHelper } from "@tanstack/react-table";
import { gql } from "graphql-request";
import { zx } from "zodix";
import { Button } from "~/components/Button";

import { Image } from "~/components/Image";
import { Tooltip, TooltipTrigger, TooltipContent } from "~/components/Tooltip";
import type { Deck } from "~/db/payload-custom-types";
import { fetchList } from "~/routes/_site+/c_+/$collectionId/utils/fetchList.server";
import { listMeta } from "~/routes/_site+/c_+/$collectionId/utils/listMeta";
import { fuzzyFilter } from "~/routes/_site+/c_+/_components/fuzzyFilter";
import { List } from "~/routes/_site+/c_+/_components/List";
export { listMeta as meta };

import { z } from "zod";
import { jsonWithError, redirectWithSuccess } from "remix-toast";
import { authRestFetcher } from "~/utils/fetchers.server";
import { manaSlug } from "~/utils/url-slug";
import { isAdding } from "~/utils/form";
import { ListTable } from "~/routes/_site+/c_+/_components/ListTable";
import { H3 } from "~/components/Headers";
import { Icon } from "~/components/Icon";
import dt from "date-and-time";
import { LoggedIn } from "~/routes/_auth+/components/LoggedIn";
import { LoggedOut } from "~/routes/_auth+/components/LoggedOut";
import { Text, TextLink } from "~/components/Text";
import { siteNanoID } from "~/utils/nanoid";

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
         query: DECKS,
         variables: {
            userId: user?.id ?? "",
         },
      },
   });
   return json({ list });
}

export default function ListPage() {
   const fetcher = useFetcher();
   const isDeckAdding = isAdding(fetcher, "newDeck");
   const { list } = useLoaderData<typeof loader>();

   return (
      <>
         <List
            gridView={deckGridView}
            columns={deckColumns}
            defaultViewType="grid"
            //@ts-ignore
            filters={filters}
         >
            <div className="flex items-center justify-between gap-3">
               <span className="font-bold font-header text-2xl">My Decks</span>
               <span className="flex-grow h-1 rounded-full dark:bg-dark450 bg-zinc-200" />
               <Button
                  onClick={() => {
                     fetcher.submit({ intent: "newDeck" }, { method: "POST" });
                  }}
                  className="h-9"
                  color="blue"
               >
                  New Deck
                  {isDeckAdding ? (
                     <Icon name="loader-2" size={16} className="animate-spin" />
                  ) : (
                     <>
                        <Icon name="plus" size={16} className="!text-white" />
                     </>
                  )}
               </Button>
            </div>
            <LoggedOut>
               <Link
                  className="border flex border-blue-200 dark:border-blue-800/70 rounded-xl shadow-sm shadow-1 
                  dark:bg-blue-900/20 bg-blue-50 py-3 px-4 mt-3  items-center justify-between"
                  to="/login?redirectTo=/c/decks"
               >
                  <Text>
                     <TextLink href="/login?redirectTo=/c/decks">
                        Login
                     </TextLink>{" "}
                     to create a deck.
                  </Text>
                  <Icon
                     className="text-blue-500"
                     name="arrow-right"
                     size={16}
                  />
               </Link>
            </LoggedOut>
            <LoggedIn>
               <ListTable
                  gridCellClassNames="dark:hover:border-zinc-600 border rounded-md bg-zinc-50 truncate dark:bg-dark350 
               border-color-sub shadow-sm dark:shadow-zinc-800/80 hover:border-zinc-300"
                  hideViewMode={true}
                  gridView={deckGridView}
                  pageSize={8}
                  defaultViewType="grid"
                  data={{
                     listData: {
                        docs: (list as { userDecks: { docs: any[] } }).userDecks
                           .docs,
                     },
                  }}
                  columns={deckColumns}
                  filters={filters}
               />
            </LoggedIn>
            <div className="pt-6 -mb-2">
               <H3>All Decks</H3>
            </div>
            <ListTable
               hideViewMode={true}
               columnViewability={{ types: false }}
               gridView={deckGridView}
               defaultViewType="list"
               data={{
                  listData: {
                     docs: (list as { publicDecks: { docs: any[] } })
                        .publicDecks.docs,
                  },
               }}
               columns={deckColumns}
               filters={filters}
               pager={false}
            />
         </List>
      </>
   );
}

export const action: ActionFunction = async ({
   context: { payload, user },
   request,
}) => {
   if (!user || !user.id) return redirect("/login", { status: 302 });

   const { intent } = await zx.parseForm(request, {
      intent: z.enum(["newDeck"]),
   });

   switch (intent) {
      case "newDeck": {
         try {
            const newDeck = await authRestFetcher({
               isAuthOverride: true,
               method: "POST",
               path: `https://pokemonpocket.tcg.wiki:4000/api/decks`,
               body: {
                  name: `${user.username}'s Deck`,
                  archetype: "6725f81a5d92d12f244d12f8",
                  slug: manaSlug(`${user.username}-${siteNanoID(8)}`),
                  user: user.id,
               },
            });

            if (newDeck) {
               return redirectWithSuccess(
                  `/c/decks/${newDeck.doc.slug}`,
                  "New deck created",
               );
            }
         } catch (error) {
            return jsonWithError(null, "Something went wrong...");
         }
      }
   }
};

const columnHelper = createColumnHelper<Deck>();

export const deckGridView = columnHelper.accessor("name", {
   filterFn: fuzzyFilter,
   cell: (info) => (
      <Link
         to={`/c/decks/${info.row.original.slug}`}
         className="flex gap-3 flex-col justify-center h-full pt-3 relative"
         key={info.row.original.id}
      >
         <div className="absolute top-2 right-2 text-zinc-500 dark:text-zinc-400">
            {info.row.original?.isPublic ? (
               <Icon name="eye" size={14} />
            ) : (
               <Icon name="eye-off" size={14} />
            )}
         </div>
         {info.row.original?.highlightCards?.length &&
         info.row.original?.highlightCards?.length > 0 ? (
            <div className="inline-flex mx-auto -space-x-8">
               {info.row.original?.highlightCards?.map(
                  (card) =>
                     card.icon?.url && (
                        <Tooltip placement="right-start" key={card.id}>
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
                                 loading="lazy"
                              />
                           </TooltipTrigger>
                           <TooltipContent>
                              <Image
                                 url={card.icon?.url}
                                 alt={card.name ?? ""}
                                 width={367}
                                 height={512}
                                 className="w-full object-contain"
                                 loading="lazy"
                              />
                           </TooltipContent>
                        </Tooltip>
                     ),
               )}
            </div>
         ) : (
            <div className="flex items-center justify-center">
               <Image
                  className="w-12 object-contain"
                  width={100}
                  url="https://static.mana.wiki/tcgwiki-pokemonpocket/CardIcon_Card_Back.png"
                  alt="Card Back"
               />
            </div>
         )}
         <div className="text-center text-sm border-t p-2 dark:border-zinc-700 space-y-1 flex flex-col justify-center">
            {info.row.original.types && info.row.original.types.length > 0 && (
               <div className="flex gap-1 justify-center -mt-4">
                  {info.row.original.types?.map((type) => (
                     <Image
                        key={type.id}
                        width={32}
                        height={32}
                        url={type.icon?.url}
                        alt={info.row.original.name ?? ""}
                        className="size-4 object-contain"
                     />
                  ))}
               </div>
            )}
            <div className="truncate font-bold">{info.getValue()}</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-center gap-1">
               <Icon
                  className="text-zinc-400 dark:!text-zinc-500"
                  name="pencil"
                  size={10}
               />
               <span>
                  {dt.format(new Date(info.row.original.updatedAt), "MMM DD")}
               </span>
            </div>
         </div>
      </Link>
   ),
});

export const deckColumns = [
   columnHelper.accessor("name", {
      header: "Deck",
      filterFn: fuzzyFilter,
      cell: (info) => {
         return (
            <Link
               to={`/c/decks/${info.row.original.slug}`}
               className="flex items-center gap-3 group py-0.5 pl-0.5 w-full group"
            >
               <div className="flex items-center gap-3 justify-between w-full">
                  <div className="flex-grow">
                     <div className="font-bold group-hover:underline">
                        {info.getValue()}
                     </div>
                     <div className="pb-0.5 flex items-center gap-1">
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 ">
                           {info.row.original?.archetype?.name}
                        </div>
                        <span className="bg-zinc-300 size-0.5 rounded-full dark:bg-zinc-600" />
                        <div className="text-[10px] text-zinc-400 dark:text-zinc-500 ">
                           {dt.format(
                              new Date(info.row.original.updatedAt),
                              "MMM DD",
                           )}
                        </div>
                     </div>
                     {info.row.original.types && (
                        <div className="flex gap-1 pt-0.5">
                           {info.row.original.types?.map((type) => (
                              <Image
                                 key={type.id}
                                 width={32}
                                 height={32}
                                 url={type.icon?.url}
                                 alt={info.row.original.name ?? ""}
                                 className="size-3.5 object-contain"
                              />
                           ))}
                        </div>
                     )}
                  </div>
                  {info.row.original?.highlightCards?.length &&
                  info.row.original?.highlightCards?.length > 0 ? (
                     <div className="inline-flex mx-auto -space-x-8">
                        {info.row.original?.highlightCards?.map(
                           (card) =>
                              card.icon?.url && (
                                 <Tooltip placement="left" key={card.id}>
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
                                          loading="lazy"
                                       />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                       <Image
                                          url={card.icon?.url}
                                          alt={card.name ?? ""}
                                          width={367}
                                          height={512}
                                          className="w-full object-contain"
                                          loading="lazy"
                                       />
                                    </TooltipContent>
                                 </Tooltip>
                              ),
                        )}
                     </div>
                  ) : (
                     <Image
                        url={
                           "https://static.mana.wiki/tcgwiki-pokemonpocket/CardIcon_Card_Back.png"
                        }
                        className="w-12 mx-auto object-contain"
                        width={200}
                        height={280}
                        alt="Card Back"
                     />
                  )}
               </div>
            </Link>
         );
      },
   }),
   columnHelper.accessor("types", {
      header: "Types",
      filterFn: (row, columnId, filterValue) => {
         const existingFilter =
            filterValue && filterValue.length > 0
               ? row?.original?.types?.some((type: any) =>
                    filterValue.includes(type.name),
                 )
               : true;

         return existingFilter ?? true;
      },
   }),
];

const DECKS = gql`
   query ($userId: String!) {
      userDecks: Decks(where: { user: { equals: $userId } }, limit: 5000) {
         totalDocs
         docs {
            id
            updatedAt
            name
            slug
            isPublic
            icon {
               url
            }
            highlightCards {
               id
               name
               icon {
                  url
               }
            }
            types {
               id
               name
               icon {
                  url
               }
            }
         }
      }
      publicDecks: Decks(where: { isPublic: { equals: true } }, limit: 5000) {
         totalDocs
         docs {
            id
            updatedAt
            name
            slug
            icon {
               url
            }
            archetype {
               name
            }
            highlightCards {
               id
               name
               icon {
                  url
               }
            }
            types {
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

const filters: {
   id: string;
   label: string;
   cols?: 1 | 2 | 3 | 4 | 5;
   options: { label?: string; value: string; icon?: string }[];
}[] = [
   {
      id: "types",
      label: "Deck Type",
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
