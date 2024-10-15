import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { createColumnHelper } from "@tanstack/react-table";
import { gql } from "graphql-request";

import { Image } from "~/components/Image";
import { Tooltip, TooltipTrigger, TooltipContent } from "~/components/Tooltip";
import { Ability, Card } from "~/db/payload-custom-types";
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
         query: ABILITIES,
      },
   });
   return json({ list });
}

export default function ListPage() {
   return <List gridView={gridView} columns={columns} />;
}

const columnHelper = createColumnHelper<Ability>();

const gridView = columnHelper.accessor("name", {
   filterFn: fuzzyFilter,
   cell: (info) => (
      <Link
         className="block relative"
         prefetch="intent"
         to={`/c/abilities/${info.row.original.slug}`}
      >
         <div
            className="truncate text-xs font-semibold text-center pt-1
               group-hover:underline decoration-zinc-400 underline-offset-2"
         >
            {info.getValue()}
         </div>
      </Link>
   ),
});

const columns = [
   columnHelper.accessor("name", {
      header: "Ability",
      filterFn: fuzzyFilter,
      cell: (info) => {
         return (
            <Link
               prefetch="intent"
               to={`/c/abilities/${info.row.original.slug}`}
               className="flex items-center gap-3 group py-0.5"
            >
               {/* <Image
                  width={36}
                  height={36}
                  url={info.row.original.icon?.url}
                  options="aspect_ratio=1:1&height=80&width=80"
               /> */}
               <span
                  className="space-y-0.5 font-semibold group-hover:underline 
                decoration-zinc-400 underline-offset-2 truncate"
               >
                  <div className="truncate">{info.getValue()}</div>
               </span>
            </Link>
         );
      },
   }),
];

const ABILITIES = gql`
   query {
      listData: Abilities(limit: 5000) {
         totalDocs
         docs {
            id
            name
            slug
         }
      }
   }
`;
