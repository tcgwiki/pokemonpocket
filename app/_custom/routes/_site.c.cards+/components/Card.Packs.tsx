import { Card, Pack } from "~/db/payload-custom-types";
import { Image } from "~/components/Image";
import { ListTable } from "~/routes/_site+/c_+/_components/ListTable";
import { H3 } from "~/components/Headers";
import { cardFilters } from "../_index";
import { createColumnHelper } from "@tanstack/react-table";
import { fuzzyFilter } from "~/routes/_site+/c_+/_components/fuzzyFilter";
import { Link } from "@remix-run/react";

export function CardPacks({ data }: { data: Pack }) {
   // Group cards by slot
   const groupedCards = data.card.packRates?.reduce(
      (acc, card) => {
         const slot = card.slot || "Unknown";
         if (!acc[slot]) acc[slot] = [];
         acc[slot].push(card);
         return acc;
      },
      {} as Record<string, typeof data.cards>,
   );
   console.log(groupedCards);

   return (
      <div className="space-y-4">
         {groupedCards &&
            Object.entries(groupedCards).map(([slot, cards]) => (
               <div key={slot} className="pt-3">
                  <div id={slot} className="pb-2 text-1">
                     {ratesEnum[slot as keyof typeof ratesEnum]}
                  </div>
                  <div
                     className="border border-color-sub  bg-2-sub rounded-xl shadow-sm shadow-1 
                     divide-y divide-color-sub"
                  >
                     {cards.map((c) => (
                        <div key={c.pack.name}>
                           <Link
                              className="flex items-center group justify-between gap-4 py-1.5 pr-4"
                              to={`/c/packs/${c.pack.slug}`}
                           >
                              <div className="flex items-center gap-2 px-3">
                                 <Image
                                    height={120}
                                    className="h-14 object-contain"
                                    url={c.pack.icon?.url}
                                 />
                                 <span
                                    className="font-semibold group-hover:underline underline-offset-4
                                 decoration-zinc-300 dark:decoration-zinc-400"
                                 >
                                    {c.pack.name}
                                 </span>
                              </div>
                              <span className="text-sm text-1 font-bold">
                                 {c.percent?.toFixed(2)}%
                              </span>
                           </Link>
                        </div>
                     ))}
                  </div>
               </div>
            ))}
      </div>
   );
}

const ratesEnum = {
   _12345: "Card inclusion probability rate from the 1st to 5th cards",
   _123: "Card inclusion probability rate from the 1st to 3rd cards",
   _4: "Card inclusion probability rate for the 4th card",
   _5: "Card inclusion probability rate for the 5th card",
};
