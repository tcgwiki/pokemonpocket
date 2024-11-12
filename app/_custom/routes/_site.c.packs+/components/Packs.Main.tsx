import { Pack } from "~/db/payload-custom-types";

import { Image } from "~/components/Image";
import { Link, NavLink } from "@remix-run/react";
import dt from "date-and-time";

import { Icon } from "~/components/Icon";
import { Button } from "~/components/Button";
import clsx from "clsx";

export function PacksMain({ data }: { data: Pack }) {
   const pack = data;

   return (
      <>
         <Link
            to={`/c/expansions/${pack.expansion?.slug}`}
            className="justify-between flex items-center gap-2 border py-1 px-3 rounded-xl shadow-sm dark:shadow-zinc-800/50
               border-zinc-200 bg-zinc-100 dark:border-zinc-600 dark:bg-dark450 group"
         >
            <span className="text-sm font-semibold flex items-center gap-3">
               <div className="flex items-center justify-center size-8 rounded-full bg-white dark:bg-dark500">
                  <Icon name="arrow-left" size={16} />
               </div>
               <span
                  className="text-sm font-bold font-mono underline dark:group-hover:decoration-zinc-400
                dark:decoration-zinc-500 underline-offset-4 decoration-zinc-300 group-hover:decoration-zinc-400"
               >
                  Back to Set
               </span>
            </span>
            <Image
               className="object-contain h-10"
               height={100}
               url={pack.expansion?.logo?.url}
            />
         </Link>
         <div
            className="flex items-center max-tablet:flex-col tablet:gap-2 gap-3 border p-4 tablet:p-3 rounded-xl shadow-sm dark:shadow-zinc-800/50 text-sm
               border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950 mt-4 justify-between font-bold"
         >
            <span>
               Pull{" "}
               <span className="underline underline-offset-4 decoration-amber-300">
                  {pack.name}
               </span>{" "}
               in the pack simulator
            </span>
            <Button
               color="amber"
               href={`/pack-simulator?expansion=${pack.expansion?.id}&pack=${pack.id}`}
            >
               Pack Simulator
            </Button>
         </div>
         <div className="flex max-tablet:flex-col justify-between gap-3 pt-4">
            {pack.expansion?.packs?.map((p) => (
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
      </>
   );
}
