import type { Deck } from "~/db/payload-custom-types";
import { Image } from "~/components/Image";
import { EditorView } from "~/routes/_editor+/core/components/EditorView";

export function ArchetypesFeaturedDecks({
   data,
}: {
   data: { featuredDecks: (Deck & { count: number })[] };
}) {
   const { featuredDecks } = data;

   return (
      <div className="border border-color-sub rounded-lg bg-3 mb-4 overflow-hidden">
         {featuredDecks?.length ? (
            <div className="divide-y divide-color-sub">
               {featuredDecks.map((deck) => (
                  <div key={deck.id}>
                     <div className="p-3 font-bold bg-2-sub border-b border-color-sub">
                        {deck.name}
                     </div>
                     <div className="grid grid-cols-3 tablet:grid-cols-5 gap-2 p-3">
                        {deck.cards?.map((card) => (
                           <div key={card.id} className="relative">
                              <Image
                                 className="object-contain"
                                 width={367}
                                 height={512}
                                 url={
                                    card?.icon?.url ??
                                    "https://static.mana.wiki/tcgwiki-pokemonpocket/CardIcon_Card_Back.png"
                                 }
                                 alt={card?.name ?? "Card Image"}
                                 loading="lazy"
                              />
                              <div className="sr-only">{card?.name}</div>
                              <div
                                 className="absolute bottom-1 right-1 text-xs text-white font-bold
                                 size-6 rounded-md flex items-center justify-center bg-zinc-900"
                              >
                                 <span className="text-xs">x</span> {card.count}
                              </div>
                           </div>
                        ))}
                     </div>
                     {deck.description ? (
                        <div className="px-3">
                           <EditorView data={deck.description} />
                        </div>
                     ) : null}
                  </div>
               ))}
            </div>
         ) : (
            <div className="text-center text-sm text-zinc-500">
               No cards in deck
            </div>
         )}
      </div>
   );
}
