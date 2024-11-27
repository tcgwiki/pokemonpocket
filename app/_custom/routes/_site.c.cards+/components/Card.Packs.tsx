import { Pack } from "~/db/payload-custom-types";
import { Image } from "~/components/Image";
import { Link } from "@remix-run/react";
import { H3 } from "~/components/Headers";

export function CardPacks({ data }: { data: Pack }) {
   // Group cards first by pool, then by slot
   const groupedCards = data.card.packRates?.reduce(
      (acc, card) => {
         const pool = card.pool || "Unknown";
         const slot = card.slot || "Unknown";

         if (!acc[pool]) acc[pool] = {};
         if (!acc[pool][slot]) acc[pool][slot] = [];

         acc[pool][slot].push(card);
         return acc;
      },
      {} as Record<string, Record<string, typeof data.cards>>,
   );

   return (
      <div className="space-y-6 pt-2">
         {groupedCards &&
            Object.entries(groupedCards).map(([pool, slotGroups]) => (
               <div key={pool} className="">
                  <div className="font-header text-lg mb-2 pl-2 border-l-4 border-color-sub">
                     {poolEnum[pool as keyof typeof poolEnum]}
                  </div>
                  {Object.entries(slotGroups).map(([slot, cards]) => (
                     <div key={slot}>
                        <div
                           className="border border-color-sub bg-2-sub rounded-lg shadow-sm shadow-1 
                           divide-y divide-color-sub overflow-hidden mb-3"
                        >
                           <div
                              id={slot}
                              className="p-3 bg-white dark:bg-dark400 text-1 text-sm font-semibold"
                           >
                              {ratesEnum[slot as keyof typeof ratesEnum]}
                           </div>
                           {cards.map((c) => (
                              <div key={c.pack.name}>
                                 <Link
                                    className="flex items-center group justify-between gap-4 py-1.5 pr-4"
                                    to={`/c/packs/${c.pack.slug}`}
                                 >
                                    <div className="flex items-center gap-2 px-3">
                                       <Image
                                          loading="lazy"
                                          height={120}
                                          width={71}
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
            ))}
      </div>
   );
}

const poolEnum = {
   normal: "Normal Pool",
   rare: "Rare Pool",
   Unknown: "Unknown Pool",
};

const ratesEnum = {
   _12345: "Card inclusion probability rate from the 1st to 5th cards",
   _123: "Card inclusion probability rate from the 1st to 3rd cards",
   _4: "Card inclusion probability rate for the 4th card",
   _5: "Card inclusion probability rate for the 5th card",
};
