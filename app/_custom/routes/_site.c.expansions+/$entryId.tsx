import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { gql } from "graphql-request";

import type { Expansion } from "~/db/payload-custom-types";
import { Entry } from "~/routes/_site+/c_+/$collectionId_.$entryId/components/Entry";
import { entryMeta } from "~/routes/_site+/c_+/$collectionId_.$entryId/utils/entryMeta";
import { fetchEntry } from "~/routes/_site+/c_+/$collectionId_.$entryId/utils/fetchEntry.server";

import { ExpansionsMain } from "./components/Expansions.Main";
import { ExpansionsCards } from "./components/Expansions.Cards";

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
   main: ExpansionsMain,
   cards: ExpansionsCards,
};

export default function EntryPage() {
   const { entry } = useLoaderData<typeof loader>();

   //@ts-ignore
   const expansion = entry?.data.expansion as Expansion;

   return <Entry customComponents={SECTIONS} customData={expansion} />;
}

const QUERY = gql`
   query ($entryId: String!) {
      expansion: Expansion(id: $entryId) {
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
