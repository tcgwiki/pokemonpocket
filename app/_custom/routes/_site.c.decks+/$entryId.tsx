import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { gql } from "graphql-request";

import type { Deck } from "~/db/payload-custom-types";
import { Entry } from "~/routes/_site+/c_+/$collectionId_.$entryId/components/Entry";
import { entryMeta } from "~/routes/_site+/c_+/$collectionId_.$entryId/utils/entryMeta";
import { fetchEntry } from "~/routes/_site+/c_+/$collectionId_.$entryId/utils/fetchEntry.server";

import { DecksDeck } from "./components/Decks.Deck";

export { entryMeta as meta };

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
   return json({
      entry,
   });
}

const SECTIONS = {
   deck: DecksDeck,
};

export default function EntryPage() {
   const { entry } = useLoaderData<typeof loader>();

   const deck = (entry?.data as { deck: Deck })?.deck;

   return <Entry customComponents={SECTIONS} customData={deck} />;
}

const QUERY = gql`
   query ($entryId: String!) {
      deck: Deck(id: $entryId) {
         id
         slug
         name
         cost
         tier
         deckTypes {
            id
            name
            icon {
               url
            }
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
         builds {
            name
            cards {
               count
               card {
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
