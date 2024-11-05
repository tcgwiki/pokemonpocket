import type { ActionFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { gql } from "graphql-request";

import { Entry } from "~/routes/_site+/c_+/$collectionId_.$entryId/components/Entry";
import { entryMeta } from "~/routes/_site+/c_+/$collectionId_.$entryId/utils/entryMeta";
import { fetchEntry } from "~/routes/_site+/c_+/$collectionId_.$entryId/utils/fetchEntry.server";

import { DecksDeck } from "./components/Decks.Deck";
import type { Archetype, Card, Deck } from "~/db/payload-custom-types";
import { z } from "zod";
import { zx } from "zodix";
import { authRestFetcher } from "~/utils/fetchers.server";
import {
   jsonWithError,
   jsonWithSuccess,
   redirectWithSuccess,
} from "remix-toast";

export { entryMeta as meta };

export type DeckLoaderData = {
   deck: Deck;
   allCards: Card[];
   deckCards: (Card & { count: number })[];
   archetypes: Archetype[];
};

export async function loader({
   context: { payload, user },
   params,
   request,
}: LoaderFunctionArgs) {
   const { entry } = await fetchEntry({
      isAuthOverride: true,
      payload,
      params,
      request,
      user,
      gql: {
         query: QUERY,
      },
   });

   const cleanCards = (
      entry.data as {
         allCards: { docs: any[] };
      }
   ).allCards.docs.map((card) => {
      return {
         ...card.cards[0],
         id: card.id,
         user: card.user,
         isHighlighted: (
            entry.data as { deck: { highlightCards?: any[] } }
         ).deck.highlightCards?.some((highlight) => highlight.id === card.id),
      };
   });
   const deckCards = (
      entry.data as { deck: { cards: any[]; highlightCards?: any[] } }
   ).deck.cards.map((card) => {
      return {
         ...card.card.cards[0],
         id: card.card.id,
         count: card.count,
         isHighlighted: (
            entry.data as { deck: { highlightCards?: any[] } }
         ).deck.highlightCards?.some(
            (highlight) => highlight.id === card.card.id,
         ),
      };
   });

   return json({
      entry,
      allCards: cleanCards,
      deckCards: deckCards,
   });
}

const SECTIONS = {
   deck: DecksDeck,
};

export default function EntryPage() {
   const { entry, allCards, deckCards } = useLoaderData<typeof loader>();

   return (
      <Entry
         customComponents={SECTIONS}
         customData={{
            deck: (entry as { data: { deck: Deck } })?.data.deck,
            allCards: allCards,
            deckCards: deckCards,
            archetypes: (
               entry as { data: { archetypes: { docs: Archetype[] } } }
            )?.data.archetypes.docs,
         }}
      />
   );
}

export const action: ActionFunction = async ({
   context: { payload, user },
   request,
}) => {
   if (!user || !user.id) return redirect("/login", { status: 302 });

   const { intent } = await zx.parseForm(request, {
      intent: z.enum([
         "updateDescription",
         "deleteDeck",
         "updateDeckName",
         "updateArchetype",
         "highlightCard",
         "toggleDeckPublic",
         "updateDeckCards",
      ]),
   });

   switch (intent) {
      case "updateDeckCards": {
         const { deckId, deckCards } = await zx.parseForm(request, {
            deckId: z.string(),
            deckCards: z.any(),
         });

         const deckData = await authRestFetcher({
            isAuthOverride: true,
            method: "GET",
            path: `https://pokemonpocket.tcg.wiki:4000/api/decks/${deckId}?depth=0`,
         });

         if (deckData.user !== user.id) {
            return jsonWithError(null, "You cannot update this deck");
         }

         const updatedDeck = await authRestFetcher({
            isAuthOverride: true,
            method: "PATCH",
            path: `https://pokemonpocket.tcg.wiki:4000/api/decks/${deckId}`,
            body: { cards: JSON.parse(deckCards) },
         });

         if (updatedDeck) {
            return jsonWithSuccess(null, "Deck updated");
         }

         return jsonWithError(null, "Failed to update deck cards");
      }
      case "updateDescription": {
         const { description, deckId } = await zx.parseForm(request, {
            deckId: z.string(),
            description: z.string(),
         });

         const deckData = await authRestFetcher({
            isAuthOverride: true,
            method: "GET",
            path: `https://pokemonpocket.tcg.wiki:4000/api/decks/${deckId}?depth=0`,
         });

         if (deckData.user !== user.id) {
            return jsonWithError(null, "You cannot update this deck");
         }

         const updatedDeck = await authRestFetcher({
            isAuthOverride: true,
            method: "PATCH",
            path: `https://pokemonpocket.tcg.wiki:4000/api/decks/${deckId}`,
            body: { description: JSON.parse(description) },
         });

         if (updatedDeck) {
            return jsonWithSuccess(null, "Description updated");
         }

         return jsonWithError(null, "Failed to update description");
      }
      case "toggleDeckPublic": {
         try {
            const { deckId } = await zx.parseForm(request, {
               deckId: z.string(),
            });

            const deckData = await authRestFetcher({
               isAuthOverride: true,
               method: "GET",
               path: `https://pokemonpocket.tcg.wiki:4000/api/decks/${deckId}?depth=0`,
            });

            if (deckData.user !== user.id) {
               return jsonWithError(null, "You cannot update this deck");
            }

            const updatedDeck = await authRestFetcher({
               isAuthOverride: true,
               method: "PATCH",
               path: `https://pokemonpocket.tcg.wiki:4000/api/decks/${deckId}`,
               body: { isPublic: !deckData.isPublic },
            });

            if (updatedDeck) {
               return jsonWithSuccess(null, "Deck visibility updated");
            }
         } catch (error) {
            return jsonWithError(null, "Something went wrong...");
         }
      }
      case "deleteDeck": {
         try {
            const { deckId } = await zx.parseForm(request, {
               deckId: z.string(),
            });
            const deckData = await authRestFetcher({
               isAuthOverride: true,
               method: "GET",
               path: `https://pokemonpocket.tcg.wiki:4000/api/decks/${deckId}?depth=0`,
            });

            if (deckData.user !== user.id) {
               return jsonWithError(null, "You cannot delete this deck");
            }

            const deletedDeck = await authRestFetcher({
               isAuthOverride: true,
               method: "DELETE",
               path: `https://pokemonpocket.tcg.wiki:4000/api/decks/${deckId}`,
            });

            if (deletedDeck) {
               return redirectWithSuccess("/c/decks", "Deck deleted");
            }
         } catch (error) {
            return jsonWithError(null, "Something went wrong...");
         }
      }
      case "highlightCard": {
         try {
            const { deckId, cardId } = await zx.parseForm(request, {
               deckId: z.string(),
               cardId: z.string(),
            });

            const deckData = await authRestFetcher({
               isAuthOverride: true,
               method: "GET",
               path: `https://pokemonpocket.tcg.wiki:4000/api/decks/${deckId}?depth=0`,
            });

            if (deckData.user !== user.id) {
               return jsonWithError(null, "You cannot update this deck");
            }

            // Check if card is already highlighted
            const isHighlighted = deckData.highlightCards?.some(
               (card: any) => card === cardId,
            );

            // If trying to highlight a new card, check the limit
            if (!isHighlighted && deckData.highlightCards?.length >= 3) {
               return jsonWithError(
                  null,
                  "Maximum of 3 highlighted cards allowed",
               );
            }

            const updatedHighlightCards = isHighlighted
               ? deckData.highlightCards.filter((card: any) => card !== cardId)
               : [...(deckData.highlightCards || []), cardId];

            const updatedDeck = await authRestFetcher({
               isAuthOverride: true,
               method: "PATCH",
               path: `https://pokemonpocket.tcg.wiki:4000/api/decks/${deckId}`,
               body: { highlightCards: updatedHighlightCards },
            });

            if (updatedDeck) {
               return jsonWithSuccess(
                  null,
                  isHighlighted ? "Card unhighlighted" : "Card highlighted",
               );
            }
         } catch (error) {
            return jsonWithError(null, "Something went wrong...");
         }
      }
      case "updateArchetype": {
         try {
            const { deckId, archetypeId } = await zx.parseForm(request, {
               deckId: z.string(),
               archetypeId: z.string(),
            });

            //Users can only mutate their own decks
            const deckData = await authRestFetcher({
               isAuthOverride: true,
               method: "GET",
               path: `https://pokemonpocket.tcg.wiki:4000/api/decks/${deckId}?depth=0`,
            });

            if (deckData.user !== user.id) {
               return jsonWithError(null, "You cannot update this deck");
            }

            const updatedDeck = await authRestFetcher({
               isAuthOverride: true,
               method: "PATCH",
               path: `https://pokemonpocket.tcg.wiki:4000/api/decks/${deckId}`,
               body: { archetype: archetypeId },
            });

            if (updatedDeck) {
               return jsonWithSuccess(null, "Archetype updated");
            }
         } catch (error) {
            return jsonWithError(
               null,
               "Something went wrong...unable to update archetype",
            );
         }
      }
      case "updateDeckName": {
         try {
            const { deckId, deckName } = await zx.parseForm(request, {
               deckId: z.string(),
               deckName: z.string(),
            });
            //Users can only mutate their own decks
            const deckData = await authRestFetcher({
               isAuthOverride: true,
               method: "GET",
               path: `https://pokemonpocket.tcg.wiki:4000/api/decks/${deckId}?depth=0`,
            });

            if (deckData.user !== user.id) {
               return jsonWithError(null, "You cannot update this deck");
            }

            const updatedDeck = await authRestFetcher({
               isAuthOverride: true,
               method: "PATCH",
               path: `https://pokemonpocket.tcg.wiki:4000/api/decks/${deckId}`,
               body: { name: deckName },
            });

            if (updatedDeck) {
               return jsonWithSuccess(null, "Deck name updated");
            }
         } catch (error) {
            return jsonWithError(
               null,
               "Something went wrong...unable to update deck name",
            );
         }
      }
   }
};

const QUERY = gql`
   query ($entryId: String!) {
      allCards: CardGroups(limit: 5000, sort: "-rarity") {
         docs {
            id
            cards {
               id
               name
               slug
               isEX
               hp
               packs {
                  id
                  name
                  icon {
                     url
                  }
               }
               expansion {
                  id
                  slug
                  icon {
                     url
                  }
                  logo {
                     url
                  }
               }
               cardType
               icon {
                  url
               }
               pokemonType {
                  name
                  icon {
                     url
                  }
               }
               weaknessType {
                  name
                  icon {
                     url
                  }
               }
               rarity {
                  name
                  icon {
                     url
                  }
               }
            }
         }
      }
      archetypes: Archetypes(limit: 1000) {
         docs {
            id
            name
         }
      }
      deck: Deck(id: $entryId) {
         id
         slug
         name
         user
         description
         isPublic
         types {
            id
            name
            icon {
               url
            }
         }
         archetype {
            id
         }
         highlightCards {
            id
            name
            slug
            icon {
               url
            }
            cards {
               slug
               icon {
                  url
               }
            }
         }
         cards {
            count
            card {
               id
               cards {
                  id
                  name
                  slug
                  hp
                  isEX
                  cardType
                  retreatCost
                  rarity {
                     name
                  }
                  weaknessType {
                     id
                     name
                     icon {
                        url
                     }
                  }
                  icon {
                     url
                  }
                  pokemonType {
                     id
                     name
                     icon {
                        url
                     }
                  }
               }
            }
         }
      }
   }
`;
