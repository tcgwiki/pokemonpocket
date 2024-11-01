import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { gql } from "graphql-request";

import type { Deck } from "~/db/payload-custom-types";
import { Entry } from "~/routes/_site+/c_+/$collectionId_.$entryId/components/Entry";
import { entryMeta } from "~/routes/_site+/c_+/$collectionId_.$entryId/utils/entryMeta";
import { fetchEntry } from "~/routes/_site+/c_+/$collectionId_.$entryId/utils/fetchEntry.server";

import { ArchetypesMain } from "./components/Archetypes.Main";

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
   main: ArchetypesMain,
};

export default function EntryPage() {
   const { entry } = useLoaderData<typeof loader>();

   return (
      <Entry
         customComponents={SECTIONS}
         customData={{
            archetype: (entry as { data: { archetype: any } })?.data.archetype,
         }}
      />
   );
}

const QUERY = gql`
   query ($entryId: String!) {
      archetype: Archetype(id: $entryId) {
         id
         slug
         name
         types {
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
      }
   }
`;
