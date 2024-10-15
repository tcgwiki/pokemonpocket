import { Expansion } from "~/db/payload-custom-types";

import { Image } from "~/components/Image";
import { Link } from "@remix-run/react";
import dt from "date-and-time";
export function ExpansionsMain({ data }: { data: Expansion }) {
   const expansion = data;

   return (
      <div>
         <div
            className="border border-color-sub divide-y divide-color-sub shadow-sm shadow-1 rounded-lg 
               mb-3 [&>*:nth-of-type(odd)]:bg-zinc-50 dark:[&>*:nth-of-type(odd)]:bg-dark350 overflow-hidden"
         >
            <div className="p-3 justify-between flex items-center gap-2">
               <span className="font-semibold text-sm">Release Date</span>
               <span className="text-sm font-semibold flex items-center gap-2">
                  <span>
                     {expansion.releaseDate
                        ? dt.format(
                             new Date(expansion.releaseDate),
                             "MMM DD, YYYY",
                          )
                        : ""}
                  </span>
               </span>
            </div>
         </div>
         {expansion?.packs && expansion?.packs?.length > 0 && (
            <div className="flex items-center justify-between gap-3">
               {expansion.packs.map((pack) => (
                  <Link
                     key={pack.name}
                     to={`/c/packs/${pack.slug}`}
                     className="text-sm font-semibold w-full bg-zinc-50 dark:bg-dark400
                      border border-zinc-200 dark:border-zinc-600/70 shadow-sm shadow-1 p-3 rounded-lg space-y-2"
                  >
                     {pack.icon?.url ? (
                        <Image
                           className="object-contain h-14 mx-auto"
                           height={100}
                           url={pack.icon?.url}
                        />
                     ) : undefined}
                     <div className="text-center text-xs">{pack.name}</div>
                  </Link>
               ))}
            </div>
         )}
      </div>
   );
}
