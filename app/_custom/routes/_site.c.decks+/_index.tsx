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
         className="flex items-center flex-col justify-center relative"
         to={`/c/decks/${info.row.original.slug}`}
      >
         {info.row.original.icon?.url ? (
            <Image
               className="object-contain"
               height={100}
               url={info.row.original.icon?.url}
            />
         ) : undefined}
         <div className="text-sm text-center font-semibold">
            {info.getValue()}
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
