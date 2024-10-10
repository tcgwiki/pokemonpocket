import { Card, Set } from "~/db/payload-custom-types";

import { Image } from "~/components/Image";
import { Link } from "@remix-run/react";
import dt from "date-and-time";
export function SetsMain({ data }: { data: Set }) {
   const set = data;

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
                     {set.releaseDate
                        ? dt.format(new Date(set.releaseDate), "MMM DD, YYYY")
                        : ""}
                  </span>
               </span>
            </div>
         </div>
         {set?.packs && set?.packs?.length > 0 && (
            <div className="flex items-center justify-between gap-4">
               {set.packs.map((pack) => (
                  <Link
                     key={pack.name}
                     to={`/c/packs/${pack.slug}`}
                     className="text-sm font-semibold w-full border border-color-sub shadow-sm shadow-1 p-2 rounded-lg"
                  >
                     {pack.icon?.url ? (
                        <Image
                           className="object-contain"
                           height={100}
                           url={pack.icon?.url}
                        />
                     ) : undefined}
                     <div className="text-center">{pack.name}</div>
                  </Link>
               ))}
            </div>
         )}
      </div>
   );
}
