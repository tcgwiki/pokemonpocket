import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { gql } from "graphql-request";

import type { Set } from "~/db/payload-custom-types";
import { Entry } from "~/routes/_site+/c_+/$collectionId_.$entryId/components/Entry";
import { entryMeta } from "~/routes/_site+/c_+/$collectionId_.$entryId/utils/entryMeta";
import { fetchEntry } from "~/routes/_site+/c_+/$collectionId_.$entryId/utils/fetchEntry.server";

import { SetsMain } from "./components/Sets.Main";
import { SetsCards } from "./components/Sets.Cards";

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
   main: SetsMain,
   cards: SetsCards,
};

export default function EntryPage() {
   const { entry } = useLoaderData<typeof loader>();

   //@ts-ignore
   const set = entry?.data.set as Set;

   return <Entry customComponents={SECTIONS} customData={set} />;
}

const QUERY = gql`
   query ($entryId: String!) {
      set: Set(id: $entryId) {
         id
         slug
         name
         releaseDate
         packs {
            name
            slug
            icon {
               url
            }
         }
         cards {
            id
            name
            slug
            isEX
            retreatCost
            hp
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
`;
