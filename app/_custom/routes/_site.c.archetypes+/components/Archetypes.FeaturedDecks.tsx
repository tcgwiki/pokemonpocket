import type { Deck } from "~/db/payload-custom-types";
import { Image } from "~/components/Image";
import { EditorView } from "~/routes/_editor+/core/components/EditorView";
import { CardViewerModal } from "../../_site.c.cards+/components/CardViewerModal";
import { H2, H3 } from "~/components/Headers";
import { Button } from "~/components/Button";
import { Icon } from "~/components/Icon";
export function ArchetypesFeaturedDecks({
   data,
}: {
   data: { featuredDecks: (Deck & { count: number })[] };
}) {
   const { featuredDecks } = data;

   const showDescription = (deck: Deck) =>
      //@ts-ignore
      !!deck?.description?.[0]?.children?.[0]?.text;

   return (
      <div className="">
         {featuredDecks?.length ? (
            <div className="space-y-8">
               {featuredDecks.map((deck) => (
                  <div key={deck.id}>
                     <H3>
                        <div className="flex items-center justify-between gap-2">
                           <div className="flex items-center gap-2">
                              {deck?.types && deck?.types?.length > 0 && (
                                 <div className="flex items-center gap-0.5">
                                    {deck.types.map((type) => (
                                       <Image
                                          className="size-4 object-contain"
                                          width={40}
                                          height={40}
                                          url={type.icon?.url}
                                          loading="lazy"
                                       />
                                    ))}
                                 </div>
                              )}
                              <span className="">{deck.name}</span>
                           </div>
                           <Button
                              color="light/zinc"
                              className="!font-bold h-8 font-body !text-xs -mr-1"
                              href={`/c/decks/${deck.slug}`}
                           >
                              Go to Deck
                              <Icon name="arrow-right" size={14} />
                           </Button>
                        </div>
                     </H3>
                     {showDescription(deck) ? (
                        <div className="">
                           <EditorView data={deck.description} />
                        </div>
                     ) : null}
                     <div className="grid grid-cols-3 tablet:grid-cols-5 gap-2">
                        {deck.cards?.map((card) => (
                           <CardViewerModal card={card} key={card.id}>
                              <>
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
                                    <span className="text-xs">x</span>{" "}
                                    {card.count}
                                 </div>
                              </>
                           </CardViewerModal>
                        ))}
                     </div>
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
