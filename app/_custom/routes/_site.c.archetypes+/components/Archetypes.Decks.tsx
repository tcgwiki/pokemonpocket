import type { Deck } from "~/db/payload-custom-types";
import { Image } from "~/components/Image";
import { EditorView } from "~/routes/_editor+/core/components/EditorView";
import {
   cardColumns,
   cardFilters,
   cardGridView,
} from "../../_site.c.cards+/_index";
import { ListTable } from "~/routes/_site+/c_+/_components/ListTable";
import { createColumnHelper } from "@tanstack/react-table";
import { fuzzyFilter } from "~/routes/_site+/c_+/_components/fuzzyFilter";
import { Link } from "@remix-run/react";
import { Icon } from "~/components/Icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/Tooltip";
import dt from "date-and-time";

export function ArchetypesDecks({
   data,
}: {
   data: { featuredDecks: (Deck & { count: number })[] };
}) {
   const { allDecks } = data;

   return (
      <ListTable
         gridView={gridView}
         defaultViewType="grid"
         data={{ listData: { docs: allDecks } }}
         columns={columns}
         filters={cardFilters}
      />
   );
}

const columnHelper = createColumnHelper<Deck>();
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

const gridView = columnHelper.accessor("name", {
   filterFn: fuzzyFilter,
   cell: (info) => (
      <Link
         to={`/c/decks/${info.row.original.slug}`}
         className="flex gap-3 flex-col justify-center h-full pt-3 relative"
         key={info.row.original.id}
      >
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
                     ),
               )}
            </div>
         ) : (
            <div className="flex items-center justify-center">
               <Image
                  className="w-12 object-contain"
                  width={100}
                  url="https://static.mana.wiki/tcgwiki-pokemonpocket/CardIcon_Card_Back.png"
               />
            </div>
         )}
         <div className="text-center text-sm border-t p-2 dark:border-zinc-700 space-y-1 flex flex-col justify-center">
            <div className="truncate font-bold">{info.getValue()}</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-center gap-1">
               {dt.format(new Date(info.row.original.updatedAt), "MMM DD")}
            </div>
         </div>
      </Link>
   ),
});
