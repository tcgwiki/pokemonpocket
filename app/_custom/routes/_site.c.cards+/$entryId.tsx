import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Outlet, useLoaderData, useRouteLoaderData } from "@remix-run/react";
import { gql } from "graphql-request";

import type { Card, CardGroup, Deck } from "~/db/payload-custom-types";
import { Entry } from "~/routes/_site+/c_+/$collectionId_.$entryId/components/Entry";
import { entryMeta } from "~/routes/_site+/c_+/$collectionId_.$entryId/utils/entryMeta";
import { fetchEntry } from "~/routes/_site+/c_+/$collectionId_.$entryId/utils/fetchEntry.server";

import { CardsMain } from "./components/Cards.Main";
import { CardsRelated } from "./components/Cards.Related";
import { gqlFetch } from "~/utils/fetchers.server";
import { CardsDecks } from "./components/Cards.Decks";

export { entryMeta as meta };

export async function loader({
   context: { payload, user },
   params,
   request,
}: LoaderFunctionArgs) {
   const { entry } = await fetchEntry({
      payload,
      params,
      request,
      user,
      gql: {
         query: CARD_QUERY,
      },
   });

   const cardGroupId = (entry?.data as any)?.relatedPokemon?.docs?.[0]?.id;

   //@ts-ignore
   const { decks } = await gqlFetch({
      isCustomDB: true,
      isCached: user ? false : true,
      query: RELATED_DECKS_QUERY,
      request,
      variables: {
         cardGroupId: cardGroupId,
      },
   });

   return json({
      entry,
      decks,
   });
}

const SECTIONS = {
   main: CardsMain,
   related: CardsRelated,
   decks: CardsDecks,
};

export function useEntryLoaderData() {
   return useRouteLoaderData<typeof loader>(
      "_custom/routes/_site.c.cards+/$entryId",
   );
}
export interface EntryCardData {
   data: {
      card: Card;
      relatedPokemon: { docs: CardGroup[] };
      decks?: Deck[];
   };
}

export default function EntryPage() {
   const { entry, decks } = useLoaderData<typeof loader>();

   return (
      <>
         <Entry
            customComponents={SECTIONS}
            customData={{ ...(entry?.data || {}), decks: decks?.docs }}
         />
         <Outlet />
      </>
   );
}

const RELATED_DECKS_QUERY = gql`
   query ($cardGroupId: JSON!) {
      decks: Decks(where: { highlightCards: { equals: $cardGroupId } }) {
         totalDocs
         docs {
            id
            name
            slug
            cost
            icon {
               url
            }
            deckTypes {
               name
               icon {
                  url
               }
            }
            highlightCards {
               id
               name
               icon {
                  url
               }
            }
         }
      }
   }
`;

const CARD_QUERY = gql`
   query ($entryId: String!, $jsonEntryId: JSON) {
      relatedPokemon: CardGroups(where: { cards: { equals: $jsonEntryId } }) {
         docs {
            id
            name
            cards {
               id
               name
               expansion {
                  slug
                  logo {
                     url
                  }
               }
               slug
               rarity {
                  name
                  icon {
                     url
                  }
               }
               icon {
                  url
               }
            }
         }
      }
      card: Card(id: $entryId) {
         id
         slug
         name
         hp
         retreatCost
         cardType
         trainerType
         desc
         icon {
            url
         }
         illustrators {
            name
         }
         packs {
            pack {
               name
            }
            rates {
               slot
               percent
            }
         }
         movesInfo {
            damage
            move {
               slug
               desc
               name
            }
            cost {
               type {
                  name
                  icon {
                     url
                  }
               }
               amount
            }
         }
         abilities {
            name
            desc
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
         expansion {
            name
            slug
            logo {
               url
            }
         }
      }
   }
`;