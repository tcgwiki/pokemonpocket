import { Pack } from "~/db/payload-custom-types";

import { Image } from "~/components/Image";
import { Link } from "@remix-run/react";
import dt from "date-and-time";

import { Icon } from "~/components/Icon";

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
      </>
   );
}
