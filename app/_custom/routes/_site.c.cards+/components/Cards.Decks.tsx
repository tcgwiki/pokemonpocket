import { Link } from "@remix-run/react";
import { Image } from "~/components/Image";
import { EntryCardData } from "../$entryId";
import { SectionTitle } from "~/routes/_site+/c_+/$collectionId_.$entryId/components/SectionTitle";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/Tooltip";
import clsx from "clsx";

export function CardsDecks({ data }: EntryCardData) {
   const { decks } = data;
   return (
      <div>
         {decks && decks.length > 0 && (
            <>
               <SectionTitle customTitle="Decks" />
               <div className="grid laptop:grid-cols-3 grid-cols-2 gap-4 pt-1">
                  {decks.map((deck) => (
                     <Link
                        to={`/decks/${deck.slug}`}
                        className="flex gap-3 flex-col justify-center border border-color-sub rounded-lg p-3 bg-zinc-50 shadow-sm shadow-1"
                        key={deck.id}
                     >
                        <div className="text-center text-sm font-bold border-b pb-2 border-color-sub">
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
                                    />
                                 </TooltipTrigger>
                                 <TooltipContent>
                                    <Image
                                       url={card.icon?.url}
                                       alt={card.name ?? ""}
                                       className="w-full object-contain"
                                    />
                                 </TooltipContent>
                              </Tooltip>
                           ))}
                        </div>
                     </Link>
                  ))}
               </div>
            </>
         )}
      </div>
   );
}
