import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { gql } from "graphql-request";

import type { Card } from "~/db/payload-custom-types";
import { Entry } from "~/routes/_site+/c_+/$collectionId_.$entryId/components/Entry";
import { entryMeta } from "~/routes/_site+/c_+/$collectionId_.$entryId/utils/entryMeta";
import { fetchEntry } from "~/routes/_site+/c_+/$collectionId_.$entryId/utils/fetchEntry.server";

import { CardsMain } from "./components/Cards.Main";
import { CardsRelated } from "./components/Cards.Related";

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

interface EntryData {
   data: {
      card: Card;
   };
}

export default function EntryPage() {
   const { entry } = useLoaderData<typeof loader>();

   return (
      <Entry
         customComponents={SECTIONS}
         customData={(entry as EntryData)?.data.card}
      />
   );
}

const QUERY = gql`
   query ($entryId: String!) {
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
