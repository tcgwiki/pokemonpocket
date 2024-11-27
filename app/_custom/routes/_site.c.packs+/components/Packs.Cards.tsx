import { Card, Pack } from "~/db/payload-custom-types";
import { Image } from "~/components/Image";
import { ListTable } from "~/routes/_site+/c_+/_components/ListTable";
import { H3 } from "~/components/Headers";
import { cardFilters } from "../../_site.c.cards+/_index";
import { createColumnHelper } from "@tanstack/react-table";
import { fuzzyFilter } from "~/routes/_site+/c_+/_components/fuzzyFilter";
import { Link } from "@remix-run/react";

export function PacksCards({ data }: { data: Pack }) {
   // Group cards by slot
   const groupedCards = data.cards?.reduce(
      (acc, card) => {
         const slot = card.slot || "Unknown";
         if (!acc[slot]) acc[slot] = [];
         acc[slot].push(card);
         return acc;
      },
      {} as Record<string, typeof data.cards>,
   );

   return (
      <div className="space-y-4">
         {groupedCards &&
            Object.entries(groupedCards).map(([slot, cards]) => (
               <div key={slot} className="mt-8">
                  <H3 id={slot}>{ratesEnum[slot as keyof typeof ratesEnum]}</H3>
                  <ListTable
                     gridView={packGridView}
                     columnViewability={{
                        pokemonType: false,
                        isEX: false,
                        cardType: false,
                     }}
                     hideViewMode={true}
                     pager={false}
                     pageSize={100}
                     gridCellClassNames=" "
                     defaultViewType="grid"
                     defaultSort={[{ id: "rarity", desc: true }]}
                     data={{
                        listData: {
                           docs: cards.map((c) => ({
                              ...c.card,
                              percent: c.percent,
                           })),
                        },
                     }}
                     columns={packCardColumns}
                     filters={cardFilters}
                  />
               </div>
            ))}
      </div>
   );
}

const ratesEnum = {
   _12345: "Card inclusion probability rate for the 1st to 5th cards",
   _123: "Card inclusion probability rate for the 1st to 3rd cards",
   _4: "Card inclusion probability rate for the 4th card",
   _5: "Card inclusion probability rate for the 5th card",
};

const columnHelper = createColumnHelper<Card>();

export const packGridView = columnHelper.accessor("name", {
   filterFn: fuzzyFilter,
   cell: (info) => (
      <Link
         className="block relative"
         to={`/c/cards/${info.row.original?.slug}`}
      >
         <div className="sr-only">{info.getValue()}</div>
         <Image
            className="object-contain"
            loading="lazy"
            width={367}
            height={512}
            url={
               info.row.original?.icon?.url ??
               "https://static.mana.wiki/tcgwiki-pokemonpocket/CardIcon_Card_Back.png"
            }
            alt={info.row.original?.name ?? "Card Back"}
         />
         {info.row.original.percent ? (
            <div className="text-sm font-bold absolute top-1.5 right-1.5 bg-zinc-900 text-white rounded-md px-1.5 py-0.5">
               {info.row.original.percent?.toFixed(2)}%
            </div>
         ) : undefined}
      </Link>
   ),
});

export const packCardColumns = [
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
                  width={100}
                  height={140}
                  url={
                     info.row.original.icon?.url ??
                     "https://static.mana.wiki/tcgwiki-pokemonpocket/CardIcon_Card_Back.png"
                  }
                  alt={info.row.original.name ?? "Card Back"}
               />
               <span
                  className="space-y-1.5 font-semibold group-hover:underline
                decoration-zinc-400 underline-offset-2 truncate"
               >
                  <div className="truncate">{info.getValue()}</div>
                  {info.row.original.pokemonType?.icon?.url ? (
                     <Image
                        className="size-4 object-contain"
                        width={40}
                        height={40}
                        url={info.row.original.pokemonType?.icon?.url}
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
];
