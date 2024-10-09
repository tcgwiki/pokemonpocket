import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Outlet, useLoaderData, useRouteLoaderData } from "@remix-run/react";
import { gql } from "graphql-request";

import css from "./components/cards.css";
import type { Card, Pokemon } from "~/db/payload-custom-types";
import { Entry } from "~/routes/_site+/c_+/$collectionId_.$entryId/components/Entry";
import { entryMeta } from "~/routes/_site+/c_+/$collectionId_.$entryId/utils/entryMeta";
import { fetchEntry } from "~/routes/_site+/c_+/$collectionId_.$entryId/utils/fetchEntry.server";

import { CardsMain } from "./components/Cards.Main";
import { CardsRelated } from "./components/Cards.Related";

export { entryMeta as meta };

export const links = () => [{ rel: "stylesheet", href: css }];

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
         query: QUERY,
      },
   });
   return json({
      entry,
   });
}

const SECTIONS = {
   main: CardsMain,
   related: CardsRelated,
};

export function useEntryLoaderData() {
   return useRouteLoaderData<typeof loader>(
      "_custom/routes/_site.c.cards+/$entryId",
   );
}
export interface EntryCardData {
   data: {
      card: Card;
      relatedPokemon: { docs: Pokemon[] };
   };
}

export default function EntryPage() {
   const { entry } = useLoaderData<typeof loader>();

   return (
      <>
         <Entry
            customComponents={SECTIONS}
            customData={(entry as EntryCardData)?.data}
         />
         <Outlet />
      </>
   );
}

const QUERY = gql`
   query ($entryId: String!, $jsonEntryId: JSON) {
      relatedPokemon: allPokemon(where: { cards: { equals: $jsonEntryId } }) {
         docs {
            name
            cards {
               id
               name
               set {
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
               image {
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
         set {
            name
            logo {
               url
            }
         }
         image {
            url
         }
      }
   }
`;
