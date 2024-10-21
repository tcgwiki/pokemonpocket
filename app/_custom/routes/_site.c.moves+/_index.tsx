import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { createColumnHelper } from "@tanstack/react-table";
import { gql } from "graphql-request";
import { descriptionParser } from "~/_custom/utils/descriptionParser";
import { TextLink } from "~/components/Text";

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
         query: MOVES,
      },
   });
   return json({ list });
}

export default function ListPage() {
   return <List gridView={gridView} columns={columns} />;
}

const columnHelper = createColumnHelper<Card>();

const gridView = columnHelper.accessor("name", {
   filterFn: fuzzyFilter,
   cell: (info) => (
      <Link
         className="block relative"
         to={`/c/moves/${info.row.original.slug}`}
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
      header: "Card",
      filterFn: fuzzyFilter,
      cell: (info) => {
         return (
            <TextLink
               className="pr-3"
               href={`/c/moves/${info.row.original.slug}`}
            >
               {info.getValue()}
            </TextLink>
         );
      },
   }),
   columnHelper.accessor("desc", {
      header: "Description",
      cell: (info) => {
         return info.getValue() ? (
            <div
               className="whitespace-pre-wrap py-2"
               dangerouslySetInnerHTML={{
                  __html: descriptionParser(info.getValue() ?? ""),
               }}
            />
         ) : (
            "-"
         );
      },
   }),
];

const MOVES = gql`
   query {
      listData: Moves(limit: 5000) {
         totalDocs
         docs {
            id
            name
            slug
            desc
         }
      }
   }
`;
