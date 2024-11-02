import type { ActionFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useFetcher } from "@remix-run/react";
import { createColumnHelper } from "@tanstack/react-table";
import clsx from "clsx";
import { gql } from "graphql-request";
import { zx } from "zodix";
import { Button } from "~/components/Button";

import { Image } from "~/components/Image";
import { Input } from "~/components/Input";
import { Tooltip, TooltipTrigger, TooltipContent } from "~/components/Tooltip";
import type { Deck } from "~/db/payload-custom-types";
import { fetchList } from "~/routes/_site+/c_+/$collectionId/utils/fetchList.server";
import { listMeta } from "~/routes/_site+/c_+/$collectionId/utils/listMeta";
import { fuzzyFilter } from "~/routes/_site+/c_+/_components/fuzzyFilter";
import { List } from "~/routes/_site+/c_+/_components/List";
export { listMeta as meta };

import { z } from "zod";
import { jsonWithError, redirectWithSuccess } from "remix-toast";
import { authRestFetcher } from "~/utils/fetchers.server";
import { manaSlug } from "~/utils/url-slug";
import { nanoid } from "nanoid";
import { useRootLoaderData } from "~/utils/useSiteLoaderData";
import { isAdding } from "~/utils/form";
export async function loader({
   context: { payload, user },
   params,
   request,
}: LoaderFunctionArgs) {
   const list = await fetchList({
      isAuthOverride: true,
      params,
      request,
      payload,
      user,
      gql: {
         query: DECKS,
      },
   });
   return json({ list });
}

export default function ListPage() {
   const fetcher = useFetcher();
   const { user } = useRootLoaderData();
   const isDeckAdding = isAdding(fetcher, "newDeck");
   return (
      <>
         <List
            columnViewability={{}}
            gridView={gridView}
            columns={columns}
            defaultViewType="grid"
            //@ts-ignore
            filters={filters}
            beforeListComponent={
               user && (
                  <Form
                     className="p-3 max-w-[728px] mx-auto shadow-sm shadow-1 flex items-center justify-center
                     gap-3 bg-zinc-50 dark:bg-dark350 border border-zinc-200 dark:border-zinc-700 rounded-lg mt-4 -mb-2.5"
                     method="POST"
                     onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(
                           e.target as HTMLFormElement,
                        );
                        fetcher.submit(
                           {
                              intent: "newDeck",
                              deckName: formData.get("deckName") as string,
                           },
                           { method: "POST" },
                        );
                     }}
                  >
                     <Input
                        placeholder="Type a deck name..."
                        className="w-full"
                        name="deckName"
                     />
                     <Button color="blue" className="flex-none" type="submit">
                        {isDeckAdding ? "Adding..." : "New Deck"}
                     </Button>
                  </Form>
               )
            }
         />
      </>
   );
}

export const action: ActionFunction = async ({
   context: { payload, user },
   request,
}) => {
   if (!user || !user.id) return redirect("/login", { status: 302 });

   const { intent } = await zx.parseForm(request, {
      intent: z.enum(["newDeck"]),
   });

   switch (intent) {
      case "newDeck": {
         try {
            const { deckName } = await zx.parseForm(request, {
               deckName: z.string(),
            });

            const newDeck = await authRestFetcher({
               isAuthOverride: true,
               method: "POST",
               path: `https://pokemonpocket.tcg.wiki:4000/api/decks`,
               body: {
                  name: deckName,
                  archetype: "6725f81a5d92d12f244d12f8",
                  slug: manaSlug(`${deckName}-${user.username}-${nanoid(6)}`),
                  user: user.id,
               },
            });

            if (newDeck) {
               return redirectWithSuccess(
                  `/c/decks/${newDeck.doc.slug}`,
                  "New deck created",
               );
            }
         } catch (error) {
            return jsonWithError(null, "Something went wrong...");
         }
      }
   }
};

const columnHelper = createColumnHelper<Deck>();

const gridView = columnHelper.accessor("name", {
   filterFn: fuzzyFilter,
   cell: (info) => (
      <Link
         to={`/c/decks/${info.row.original.slug}`}
         className="flex gap-3 flex-col justify-center"
         key={info.row.original.id}
      >
         <div className="inline-flex mx-auto -space-x-8">
            {info.row.original?.highlightCards?.map(
               (card) =>
                  card.icon?.url && (
                     <Tooltip placement="right-start" key={card.id}>
                        <TooltipTrigger
                           className="shadow-sm shadow-1 z-10"
                           key={card.id}
                        >
                           <Image
                              url={card.icon?.url}
                              alt={card.name ?? ""}
                              className="w-12 object-contain"
                              width={200}
                              height={280}
                           />
                        </TooltipTrigger>
                        <TooltipContent>
                           <Image
                              url={card.icon?.url}
                              alt={card.name ?? ""}
                              width={367}
                              height={512}
                              className="w-full object-contain"
                           />
                        </TooltipContent>
                     </Tooltip>
                  ),
            )}
         </div>
         <div className="text-center text-sm font-bold border-t pt-1 dark:border-zinc-600 space-y-1">
            {info.row.original.types && (
               <div
                  className={clsx(
                     "flex gap-1 justify-center",
                     info.row.original.types.length > 0 && "-mt-3",
                  )}
               >
                  {info.row.original.types?.map((type) => (
                     <Image
                        key={type.id}
                        width={32}
                        height={32}
                        url={type.icon?.url}
                        alt={info.row.original.name ?? ""}
                        className="size-4 object-contain"
                     />
                  ))}
               </div>
            )}
            <div>{info.getValue()}</div>
         </div>
      </Link>
   ),
});

const columns = [
   columnHelper.accessor("name", {
      header: "Deck",
      filterFn: fuzzyFilter,
      cell: (info) => {
         return (
            <Link
               prefetch="intent"
               to={`/c/decks/${info.row.original.slug}`}
               className="flex items-center gap-3 group py-0.5"
            >
               {info.getValue()}
            </Link>
         );
      },
   }),
];

const DECKS = gql`
   query {
      listData: Decks(where: { isPublic: { equals: true } }, limit: 5000) {
         totalDocs
         docs {
            id
            name
            slug
            icon {
               url
            }
            highlightCards {
               id
               name
               icon {
                  url
               }
            }
            types {
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

const filters: {
   id: string;
   label: string;
   cols?: 1 | 2 | 3 | 4 | 5;
   options: { label?: string; value: string; icon?: string }[];
}[] = [];
