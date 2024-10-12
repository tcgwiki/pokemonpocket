import { Link } from "@remix-run/react";

import { Image } from "~/components/Image";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/Tooltip";
import { SectionTitle } from "~/routes/_site+/c_+/$collectionId_.$entryId/components/SectionTitle";

import type { EntryCardData } from "../$entryId";

export function CardsDecks({ data }: EntryCardData) {
   const { decks } = data;
   return (
      <div>
         {decks && decks.length > 0 && (
            <>
               <SectionTitle customTitle="Decks" />
               <div className="grid laptop:grid-cols-3 grid-cols-2 gap-3">
                  {decks.map((deck) => (
                     <Link
                        to={`/c/decks/${deck.slug}`}
                        className="flex gap-3 flex-col justify-center border border-color-sub rounded-lg p-3 dark:bg-dark400 bg-zinc-50 shadow-sm shadow-1"
                        key={deck.id}
                     >
                        <div className="text-center text-sm font-bold border-b pb-1 border-color-sub">
                           {deck.name}
                        </div>
                        <div className="inline-flex mx-auto -space-x-8">
                           {deck?.highlightCards?.map((card) => (
                              <Tooltip placement="right-start">
                                 <TooltipTrigger
                                    className="shadow-sm shadow-1 z-10"
                                    key={card.id}
                                 >
                                    <Image
                                       url={card.icon?.url}
                                       alt={card.name ?? ""}
                                       className="w-20 object-contain"
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
                           ))}
                        </div>
                        {}
                     </Link>
                  ))}
               </div>
            </>
         )}
      </div>
   );
}
