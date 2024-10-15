import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { createColumnHelper } from "@tanstack/react-table";
import { gql } from "graphql-request";

import { Image } from "~/components/Image";
import { Tooltip, TooltipTrigger, TooltipContent } from "~/components/Tooltip";
import { Deck } from "~/db/payload-custom-types";
import { fetchList } from "~/routes/_site+/c_+/$collectionId/utils/fetchList.server";
import { listMeta } from "~/routes/_site+/c_+/$collectionId/utils/listMeta";
import { fuzzyFilter } from "~/routes/_site+/c_+/_components/fuzzyFilter";
import { List } from "~/routes/_site+/c_+/_components/List";
import clsx from "clsx";
export { listMeta as meta };

export async function loader({
   context: { payload, user },
   params,
   request,
}: LoaderFunctionArgs) {
   const list = await fetchList({
      params,
      request,
      payload,
      user,
      gql: {
         query: DECKS,
      },
   });
   return json({ list });
}

export default function ListPage() {
   return (
      <List
         columnViewability={{}}
         gridView={gridView}
         columns={columns}
         defaultViewType="grid"
         //@ts-ignore
         filters={filters}
      />
   );
}

const columnHelper = createColumnHelper<Deck>();

const gridView = columnHelper.accessor("name", {
   filterFn: fuzzyFilter,
   cell: (info) => (
      <Link
         to={`/c/decks/${info.row.original.slug}`}
         className="flex gap-3 flex-col justify-center"
         key={info.row.original.id}
      >
         <div className="inline-flex mx-auto -space-x-8">
            {info.row.original?.highlightCards?.map((card) => (
               <Tooltip placement="right-start">
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
                  <TooltipContent>
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
   ),
});

const columns = [
   columnHelper.accessor("name", {
      header: "Deck",
      filterFn: fuzzyFilter,
      cell: (info) => {
         return (
            <Link
               prefetch="intent"
               to={`/c/decks/${info.row.original.slug}`}
               className="flex items-center gap-3 group py-0.5"
            >
               {info.getValue()}
            </Link>
         );
      },
   }),
];

const DECKS = gql`
   query {
      listData: Decks(limit: 5000) {
         totalDocs
         docs {
            id
            name
            slug
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

const filters: {
   id: string;
   label: string;
   cols?: 1 | 2 | 3 | 4 | 5;
   options: { label?: string; value: string; icon?: string }[];
}[] = [];