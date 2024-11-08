import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { gql } from "graphql-request";

import { Entry } from "~/routes/_site+/c_+/$collectionId_.$entryId/components/Entry";
import { entryMeta } from "~/routes/_site+/c_+/$collectionId_.$entryId/utils/entryMeta";
import { fetchEntry } from "~/routes/_site+/c_+/$collectionId_.$entryId/utils/fetchEntry.server";

import { ArchetypesMain } from "./components/Archetypes.Main";
import { ArchetypesDecks } from "./components/Archetypes.Decks";
import { ArchetypesFeaturedDecks } from "./components/Archetypes.FeaturedDecks";

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

   const featuredDecks = (entry.data as { archetype: { featuredDecks: any[] } })
      .archetype.featuredDecks;

   const cleanedFeaturedDecks = featuredDecks?.map((deck) => {
      return {
         ...deck,
         cards: deck.cards.map((card: any) => {
            return {
               ...card.card.cards[0],
               name: card.card.name,
               count: card.count,
            };
         }),
      };
   });

   return json({
      entry,
      featuredDecks: cleanedFeaturedDecks,
   });
}

const SECTIONS = {
   main: ArchetypesMain,
   "featured-decks": ArchetypesFeaturedDecks,
   decks: ArchetypesDecks,
};

export default function EntryPage() {
   const { entry, featuredDecks } = useLoaderData<typeof loader>();

   return (
      <Entry
         customComponents={SECTIONS}
         customData={{
            archetype: (entry as { data: { archetype: any } })?.data.archetype,
            allDecks: (entry as { data: { allDecks: any } })?.data.allDecks
               .docs,
            featuredDecks,
         }}
      />
   );
}

const QUERY = gql`
   query ($entryId: String!, $jsonEntryId: JSON) {
      allDecks: Decks(
         where: { archetype: { equals: $jsonEntryId } }
         sort: "-updatedAt"
      ) {
         docs {
            name
            slug
            updatedAt
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
         }
      }
      archetype: Archetype(id: $entryId) {
         id
         slug
         name
         tier
         types {
            id
            name
            icon {
               url
            }
         }
         featuredDecks {
            description
            name
            slug
            types {
               id
               name
               icon {
                  url
               }
            }
            cards {
               count
               card {
                  id
                  name
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
      }
   }
`;
