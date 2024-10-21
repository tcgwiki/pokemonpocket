import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { createColumnHelper } from "@tanstack/react-table";
import { gql } from "graphql-request";

import { Image } from "~/components/Image";
import { Expansion } from "~/db/payload-custom-types";
import { fetchList } from "~/routes/_site+/c_+/$collectionId/utils/fetchList.server";
import { listMeta } from "~/routes/_site+/c_+/$collectionId/utils/listMeta";
import { fuzzyFilter } from "~/routes/_site+/c_+/_components/fuzzyFilter";
import { List } from "~/routes/_site+/c_+/_components/List";

import dt from "date-and-time";

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
         query: EXPANSIONS,
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
      />
   );
}

const columnHelper = createColumnHelper<Expansion>();

const gridView = columnHelper.accessor("name", {
   filterFn: fuzzyFilter,
   cell: (info) => (
      <Link
         className="flex items-center flex-col justify-center relative gap-1"
         to={`/c/expansions/${info.row.original.slug}`}
      >
         <div className="text-sm text-center font-semibold">
            {info.getValue()}
         </div>
         {info.row.original.logo?.url ? (
            <Image
               className="object-contain h-12"
               height={100}
               url={info.row.original.logo?.url}
            />
         ) : undefined}
         <div className="text-[10px] text-center font-semibold text-1">
            {info.row.original.releaseDate
               ? dt.format(
                    new Date(info.row.original.releaseDate),
                    "MMM DD, YYYY",
                 )
               : ""}
         </div>
      </Link>
   ),
});

const columns = [
   columnHelper.accessor("name", {
      header: "Card",
      filterFn: fuzzyFilter,
      cell: (info) => {
         return (
            <Link
               prefetch="intent"
               to={`/c/expansions/${info.row.original.slug}`}
               className="flex items-center gap-3 group py-0.5"
            >
               {info.getValue()}
            </Link>
         );
      },
   }),
];

const EXPANSIONS = gql`
   query {
      listData: Expansions(limit: 5000) {
         totalDocs
         docs {
            id
            name
            slug
            releaseDate
            logo {
               url
            }
            icon {
               url
            }
         }
      }
   }
`;
