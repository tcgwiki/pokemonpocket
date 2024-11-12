import { Expansion } from "~/db/payload-custom-types";

import { Image } from "~/components/Image";
import { Link, NavLink } from "@remix-run/react";
import dt from "date-and-time";
import clsx from "clsx";
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
         <div className="flex max-tablet:flex-col justify-between gap-3">
            {expansion.packs?.map((p) => (
               <NavLink
                  className={({ isActive }) =>
                     clsx(
                        "flex items-center dark:hover:bg-dark500 hover:bg-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-500 dark:hover:shadow-zinc-800/50 justify-between w-full  gap-2 border shadow-1 pl-3 pr-1 py-2 rounded-xl shadow-sm",
                        isActive
                           ? "dark:bg-dark500 bg-zinc-200/80  border-zinc-400/70 dark:border-zinc-500 dark:shadow-zinc-800/50"
                           : "bg-zinc-50 dark:bg-dark400 border-zinc-200 dark:border-zinc-600",
                     )
                  }
                  to={`/c/packs/${p.slug}`}
                  key={p.slug}
               >
                  <Image className="h-11" height={80} url={p.logo?.url} />
                  <Image className="h-14" height={80} url={p.icon?.url} />
                  <span className="sr-only">{p.name}</span>
               </NavLink>
            ))}
         </div>
      </div>
   );
}
